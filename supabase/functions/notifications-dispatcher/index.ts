// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

type Job = {
  id: string
  type: string
  recipient_id: string
  payload: any
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
// Service role key must not use SUPABASE_* prefix as secret name. Support both for flexibility.
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN')

if (!SERVICE_ROLE_KEY) {
  throw new Error('Missing SERVICE_ROLE_KEY secret for notifications-dispatcher')
}
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

function isExpoPushToken(token: string): boolean {
  return typeof token === 'string' && token.startsWith('ExponentPushToken[')
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

export async function handler(req: Request): Promise<Response> {
  if (!EXPO_ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: 'Expo not configured' }), { status: 500 })
  }

  // Fetch up to N pending jobs due now
  const { data: jobs, error } = await supabase
    .from('notification_jobs')
    .select('id, type, recipient_id, payload')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(100)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!jobs || jobs.length === 0) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }))
  }

  // Mark jobs as processing
  await supabase
    .from('notification_jobs')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .in('id', jobs.map(j => j.id))

  // Load tokens
  const recipientIds = Array.from(new Set(jobs.map(j => j.recipient_id)))
  const { data: tokens } = await supabase
    .from('expo_push_tokens')
    .select('user_id, token')
    .in('user_id', recipientIds)

  const userIdToTokens = new Map<string, string[]>()
  for (const row of tokens || []) {
    userIdToTokens.set(row.user_id, [...(userIdToTokens.get(row.user_id) || []), row.token])
  }

  // Build messages
  const messages: any[] = []
  const jobIdToTokens = new Map<string, string[]>()

  for (const job of jobs as Job[]) {
    const toTokens = userIdToTokens.get(job.recipient_id) || []
    jobIdToTokens.set(job.id, toTokens)
    if (toTokens.length === 0) continue

    let title = 'Notification'
    let body = ''
    let data: any = { type: job.type, ...(job.payload || {}) }

    if (job.type === 'message') {
      const senderName = (job.payload?.senderName && String(job.payload.senderName).trim()) || 'New message'
      title = senderName
      body = job.payload?.preview || 'Open DharmaSaathi to read it'
    } else if (job.type === 'like') {
      title = `Someone liked you`
      body = 'Open DharmaSaathi to see who'
    } else if (job.type === 'superlike') {
      title = `You received a Super Like`
      body = 'Open DharmaSaathi to see who'
    } else if (job.type === 'match') {
      const otherName = (job.payload?.otherName && String(job.payload.otherName).trim()) || 'your match'
      title = `It’s a match!`
      body = `Start a conversation with ${otherName}`
    }

    for (const token of toTokens) {
      if (!isExpoPushToken(token)) continue
      messages.push({ to: token, title, body, sound: 'default', data, priority: 'high' })
    }
  }

  // Send via Expo HTTP API in chunks
  const chunks = chunkArray(messages, 100)
  const deliveredTokens = new Set<string>()
  const invalidTokens = new Set<string>()
  for (const chunk of chunks) {
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${EXPO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(chunk),
      })
      const json = await res.json().catch(() => ({})) as any
      const results: any[] = Array.isArray(json?.data) ? json.data : []
      for (let i = 0; i < results.length; i++) {
        const r = results[i]
        const token = chunk[i]?.to
        if (!token) continue
        if (r?.status === 'ok') {
          deliveredTokens.add(token)
        } else if (r?.details?.error === 'DeviceNotRegistered') {
          invalidTokens.add(token)
        }
      }
    } catch (e) {
      console.error('Expo send error', e)
    }
  }

  // Mark jobs: sent if any token delivered, else keep pending with slight delay
  const deliveredJobIds = new Set<string>()
  for (const job of jobs as Job[]) {
    const toks = jobIdToTokens.get(job.id) || []
    if (toks.some(t => deliveredTokens.has(t))) deliveredJobIds.add(job.id)
  }
  const nowIso = new Date().toISOString()
  if (deliveredJobIds.size > 0) {
    await supabase
      .from('notification_jobs')
      .update({ status: 'sent', updated_at: nowIso })
      .in('id', Array.from(deliveredJobIds))
  }
  const notDelivered = (jobs as Job[]).map(j => j.id).filter(id => !deliveredJobIds.has(id))
  if (notDelivered.length > 0) {
    const retryAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    await supabase
      .from('notification_jobs')
      .update({ status: 'pending', attempts: (undefined as any), scheduled_at: retryAt, updated_at: nowIso })
      .in('id', notDelivered)
  }

  // Touch tokens
  try {
    if (deliveredTokens.size > 0) {
      await supabase.rpc('touch_tokens_last_used', { tokens_in: Array.from(deliveredTokens) as any })
    }
  } catch {}

  // Prune invalid tokens
  if (invalidTokens.size > 0) {
    await supabase.from('expo_push_tokens').delete().in('token', Array.from(invalidTokens))
  }

  return new Response(JSON.stringify({ ok: true, processed: jobs.length, delivered: deliveredTokens.size, invalid: invalidTokens.size }))
}

// HTTP entrypoint (Supabase Edge Functions use Deno.serve)
Deno.serve(handler)



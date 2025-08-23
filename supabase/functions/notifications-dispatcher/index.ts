// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import Expo from 'https://esm.sh/expo-server-sdk@3.10.0'

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
const expo = EXPO_ACCESS_TOKEN ? new Expo({ accessToken: EXPO_ACCESS_TOKEN }) : null

export async function handler(req: Request): Promise<Response> {
  if (!expo) {
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
      title = `New message`
      body = job.payload?.preview || 'Open DharmaSaathi to read it'
    } else if (job.type === 'like') {
      title = `Someone liked you`
      body = 'Open DharmaSaathi to see who'
    } else if (job.type === 'superlike') {
      title = `You received a Super Like`
      body = 'Open DharmaSaathi to see who'
    } else if (job.type === 'match') {
      title = `It’s a match!`
      body = 'Start chatting now'
    }

    for (const token of toTokens) {
      if (!Expo.isExpoPushToken(token)) continue
      messages.push({ to: token, title, body, sound: 'default', data })
    }
  }

  // Send in chunks
  const chunks = expo.chunkPushNotifications(messages)
  const tickets: any[] = []
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk)
      tickets.push(...ticketChunk)
    } catch (e) {
      console.error('Expo send error', e)
    }
  }

  // Mark jobs done (best-effort). Failed device tokens are pruned by API.
  await supabase
    .from('notification_jobs')
    .update({ status: 'sent', updated_at: new Date().toISOString() })
    .in('id', jobs.map(j => j.id))

  // Touch tokens
  try {
    const okTokens = messages.map(m => m.to)
    await supabase.rpc('touch_tokens_last_used', { tokens_in: okTokens })
  } catch {}

  return new Response(JSON.stringify({ ok: true, processed: jobs.length, ticketsCount: tickets.length }))
}

// HTTP entrypoint
serve(handler)



import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client using service-role key – required to bypass RLS for whatsapp_outbox insert
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId, phone, firstName } = await req.json()

    if (!phone) {
      return NextResponse.json(
        { error: 'Missing phone' },
        { status: 400 }
      )
    }

    // Clean phone number – digits only, no plus sign
    const cleanPhone = String(phone).replace(/[^\d]/g, '')

    // Resolve first name – priority: payload → DB → fallback
    let resolvedName: string | null = firstName || null

    if (!resolvedName && userId) {
      const { data: userRow } = await supabase
        .from('users')
        .select('first_name')
        .eq('id', userId)
        .maybeSingle()
      if (userRow?.first_name) {
        resolvedName = userRow.first_name as string
      }
    }

    if (!resolvedName) {
      // Try lookup by phone if userId missing
      const { data: userRow } = await supabase
        .from('users')
        .select('first_name')
        .eq('phone', cleanPhone)
        .maybeSingle()
      if (userRow?.first_name) {
        resolvedName = userRow.first_name as string
      }
    }

    if (!resolvedName) {
      resolvedName = 'Friend'
    }

    const { error } = await supabase.from('whatsapp_outbox').insert({
      user_id: userId ?? null,
      phone: cleanPhone,
      template_name: 'onboarding',
      payload: { name: resolvedName },
      send_after: new Date(Date.now() + 30 * 60_000) // 30 minutes later
    })

    if (error) {
      console.error('[WhatsApp Enqueue] insert failed', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[WhatsApp Enqueue] unexpected error', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 
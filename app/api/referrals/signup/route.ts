import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use server-side Supabase client with service role for secure RPC calls
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { newUserId, referralCode } = await request.json()

    if (!newUserId || !referralCode) {
      return NextResponse.json(
        { error: 'Missing required parameters: newUserId and referralCode' },
        { status: 400 }
      )
    }

    // Call the database function to handle referral signup
    const { data, error } = await supabase.rpc('handle_referral_signup', {
      new_user_id: newUserId,
      referral_code: referralCode
    })

    if (error) {
      console.error('Database function error:', error)
      return NextResponse.json(
        { error: 'Failed to process referral', details: error.message },
        { status: 500 }
      )
    }

    if (data === true) {
      // Referral processed successfully
      return NextResponse.json({
        success: true,
        message: 'Referral processed successfully'
      })
    } else {
      // Referral code not found or invalid
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired referral code'
      })
    }

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
} 
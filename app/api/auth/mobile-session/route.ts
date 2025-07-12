import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify user exists and get their details
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.mobile_verified) {
      return NextResponse.json({ error: 'Mobile not verified' }, { status: 403 });
    }

    // Create a one-time session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store the session token in a temporary table or cache
    // For now, we'll use the otp_verifications table with a special purpose
    const { error: tokenError } = await supabaseAdmin
      .from('otp_verifications')
      .insert({
        user_id: userId,
        mobile_number: user.phone,
        otp_code: sessionToken,
        purpose: 'mobile_session',
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('Failed to store session token:', tokenError);
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Return the session token and user data
    return NextResponse.json({ 
      success: true,
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        isOnboarded: user.is_onboarded,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
    
  } catch (err: any) {
    console.error('Mobile session error:', err);
    return NextResponse.json({ 
      error: err.message || 'Internal error' 
    }, { status: 500 });
  }
} 
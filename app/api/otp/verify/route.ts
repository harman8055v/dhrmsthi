import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, purpose } = await req.json();
    if (!phone || !otp || !purpose) {
      return NextResponse.json({ error: 'Missing phone, otp, or purpose' }, { status: 400 });
    }
    
    // Find OTP record
    const { data: otpRecord, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('mobile_number', phone)
      .eq('otp_code', otp)
      .eq('purpose', purpose)
      .gte('expires_at', new Date().toISOString())
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error || !otpRecord) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }
    
    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ 
        verified_at: new Date().toISOString(),
        attempts: otpRecord.attempts + 1
      })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.error('Failed to update OTP record:', updateError);
    }

    // Check if user exists with this phone number
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, is_onboarded, first_name')
      .eq('phone', phone)
      .single();

    // Update user's mobile_verified status if they exist
    if (existingUser) {
      await supabase
        .from('users')
        .update({ 
          mobile_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id);
        
      // For login purpose, create a real Supabase session via temp password
      if (purpose === 'login' && existingUser.email) {
        try {
          // 1) Generate one-time password
          const tempPassword = `otp_${crypto.randomUUID()}`;

          // 2) Set it on the user via admin API
          const { error: pwdErr } = await supabase.auth.admin.updateUserById(existingUser.id, {
            password: tempPassword,
            email_confirm: true,
          });
          if (pwdErr) throw pwdErr;

          // 3) Sign in with that password to get a real session
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: existingUser.email,
            password: tempPassword,
          });
          if (signInErr) throw signInErr;

          if (signInData.session) {
            return NextResponse.json({
              success: true,
              message: 'OTP verified successfully',
              isExistingUser: true,
              userId: existingUser.id,
              isOnboarded: existingUser.is_onboarded || false,
              session: {
                access_token: signInData.session.access_token,
                refresh_token: signInData.session.refresh_token,
              },
            });
          }
        } catch (sessionError) {
          console.error('Failed to create session:', sessionError);
          // fall through to generic response
        }
      }
    }

    // Removed WhatsApp outbox insertion here to avoid duplicates.

    return NextResponse.json({ 
      success: true, 
      message: 'OTP verified successfully',
      isExistingUser: !!existingUser,
      userId: existingUser?.id,
      isOnboarded: existingUser?.is_onboarded || false
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

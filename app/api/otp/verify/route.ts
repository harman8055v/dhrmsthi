import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Normalize phone number to E164 format for consistency
function normalizePhoneForDb(phone: string): string {
  let digitsOnly = phone.replace(/[^\d]/g, '');
  if (digitsOnly.length === 10 && !digitsOnly.startsWith('91')) {
    digitsOnly = '91' + digitsOnly;
  }
  return '+' + digitsOnly;
}

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, purpose } = await req.json();
    if (!phone || !otp || !purpose) {
      return NextResponse.json({ 
        error: 'Missing required fields. Please provide phone, OTP, and purpose.', 
        code: 'MISSING_FIELDS' 
      }, { status: 400 });
    }
    
    // Normalize phone number
    const normalizedPhone = normalizePhoneForDb(phone);
    const now = new Date();
    
    // First, check for recent attempts to prevent brute force
    const { data: recentAttempts, error: attemptsError } = await supabase
      .from('otp_verifications')
      .select('attempts, created_at')
      .eq('mobile_number', normalizedPhone)
      .eq('purpose', purpose)
      .gte('created_at', new Date(now.getTime() - 30 * 60 * 1000).toISOString()) // Last 30 mins
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!attemptsError && recentAttempts) {
      const totalAttempts = recentAttempts.reduce((sum, record) => sum + (record.attempts || 0), 0);
      if (totalAttempts >= 10) {
        return NextResponse.json({ 
          error: 'Too many failed attempts. Please wait 30 minutes before trying again.',
          code: 'TOO_MANY_ATTEMPTS',
          retryAfter: 30 * 60 // seconds
        }, { status: 429 });
      }
    }
    
    // Find valid OTP record
    const { data: otpRecord, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('mobile_number', normalizedPhone)
      .eq('otp_code', otp)
      .eq('purpose', purpose)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error || !otpRecord) {
      // Check if OTP exists but is expired
      const { data: anyOtpRecord } = await supabase
        .from('otp_verifications')
        .select('expires_at, attempts')
        .eq('mobile_number', normalizedPhone)
        .eq('otp_code', otp)
        .eq('purpose', purpose)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (anyOtpRecord) {
        // Increment attempts
        await supabase
          .from('otp_verifications')
          .update({ attempts: (anyOtpRecord.attempts || 0) + 1 })
          .eq('mobile_number', normalizedPhone)
          .eq('otp_code', otp)
          .eq('purpose', purpose);
          
        if (new Date(anyOtpRecord.expires_at) < now) {
          return NextResponse.json({ 
            error: 'This OTP has expired. Please request a new one.',
            code: 'OTP_EXPIRED'
          }, { status: 400 });
        }
      }
      
      // Check if there's any recent OTP for this number (user might have mistyped)
      const { data: recentOtp } = await supabase
        .from('otp_verifications')
        .select('created_at')
        .eq('mobile_number', normalizedPhone)
        .eq('purpose', purpose)
        .gte('expires_at', now.toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (recentOtp) {
        return NextResponse.json({ 
          error: 'Invalid OTP. Please check the 6-digit code sent to your WhatsApp.',
          code: 'INVALID_OTP'
        }, { status: 400 });
      } else {
        return NextResponse.json({ 
          error: 'No valid OTP found. Please request a new OTP.',
          code: 'NO_OTP_FOUND'
        }, { status: 400 });
      }
    }
    
    // Check if OTP is expired
    if (new Date(otpRecord.expires_at) < now) {
      return NextResponse.json({ 
        error: 'This OTP has expired. Please request a new one.',
        code: 'OTP_EXPIRED'
      }, { status: 400 });
    }
    
    // Mark OTP as verified
    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ 
        verified_at: now.toISOString(),
        attempts: (otpRecord.attempts || 0) + 1
      })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.error('Failed to update OTP record:', updateError);
    }

    // Check if user exists with this phone number
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, is_onboarded, first_name')
      .eq('phone', normalizedPhone)
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
        
      // For login purpose, create a more reliable session
      if (purpose === 'login' && existingUser.email) {
        try {
          // Try magic link approach first
          const { data: magicLinkData, error: magicLinkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: existingUser.email,
            options: {
              redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth-loading?userId=${existingUser.id}&mobileLogin=true`
            }
          });

          if (!magicLinkError && magicLinkData) {
            // Extract the token from the magic link
            const url = new URL(magicLinkData.properties.action_link);
            const token = url.searchParams.get('token');
            
            console.log('Magic link created successfully for mobile login');
            
            return NextResponse.json({
              success: true,
              message: 'OTP verified successfully',
              isExistingUser: true,
              userId: existingUser.id,
              isOnboarded: existingUser.is_onboarded || false,
              magicToken: token,
              firstName: existingUser.first_name
            });
          }
          
          // Fallback to password-based session if magic link fails
          console.log('Magic link failed, trying password-based session');
          
          // Generate a secure temporary password
          const tempPassword = `OTP_${crypto.randomUUID()}_${Date.now()}`;

          // Update user password
          const { error: pwdErr } = await supabase.auth.admin.updateUserById(existingUser.id, {
            password: tempPassword,
            email_confirm: true,
            phone_confirm: true
          });
          
          if (pwdErr) {
            console.error('Failed to update password:', pwdErr);
            throw pwdErr;
          }

          // Sign in with the temporary password
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: existingUser.email,
            password: tempPassword,
          });
          
          if (signInErr) {
            console.error('Failed to sign in with temp password:', signInErr);
            throw signInErr;
          }

          if (signInData.session) {
            console.log('Session created successfully with temp password');
            
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
              firstName: existingUser.first_name
            });
          }
        } catch (sessionError) {
          console.error('Session creation failed:', sessionError);
          // Continue without session - frontend will handle with localStorage fallback
        }
      }
    }

    // Removed WhatsApp outbox insertion here to avoid duplicates.

    return NextResponse.json({ 
      success: true, 
      message: 'OTP verified successfully',
      isExistingUser: !!existingUser,
      userId: existingUser?.id,
      isOnboarded: existingUser?.is_onboarded || false,
      firstName: existingUser?.first_name
    });
  } catch (err: any) {
    console.error('OTP verification error:', err);
    return NextResponse.json({ 
      error: err.message || 'Failed to verify OTP. Please try again.',
      code: 'VERIFICATION_ERROR'
    }, { status: 500 });
  }
}

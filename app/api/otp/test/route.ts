import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    // Get OTP statistics
    const { data: stats, error: statsError } = await supabase
      .from('otp_statistics')
      .select('*');
      
    // Get recent OTPs (last 10)
    const { data: recentOtps, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    // Check WATI configuration
    const watiConfig = {
      hasToken: !!process.env.WATI_ACCESS_TOKEN,
      hasEndpoint: !!process.env.WATI_API_ENDPOINT,
      endpoint: process.env.WATI_API_ENDPOINT || 'Not configured'
    };
    
    // Test phone number normalization
    const testNumbers = [
      '9876543210',      // Indian without country code
      '+919876543210',   // Indian with country code
      '919876543210',    // Without +
      '+1234567890',     // International
    ];
    
    const normalizedNumbers = testNumbers.map(num => {
      const digitsOnly = num.replace(/[^\d]/g, '');
      let normalized = digitsOnly;
      if (digitsOnly.length === 10 && !digitsOnly.startsWith('91')) {
        normalized = '91' + digitsOnly;
      }
      return {
        original: num,
        normalized: '+' + normalized,
        watiFormat: normalized
      };
    });
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        appUrl: process.env.NEXT_PUBLIC_APP_URL
      },
      watiConfig,
      statistics: stats || [],
      recentOtps: recentOtps?.map(otp => ({
        id: otp.id,
        mobile_number: otp.mobile_number,
        purpose: otp.purpose,
        created_at: otp.created_at,
        expires_at: otp.expires_at,
        verified_at: otp.verified_at,
        attempts: otp.attempts,
        isExpired: new Date(otp.expires_at) < new Date(),
        otp_code: process.env.NODE_ENV === 'development' ? otp.otp_code : 'HIDDEN'
      })) || [],
      phoneNormalizationTest: normalizedNumbers,
      cleanupInfo: {
        message: 'Run SELECT cleanup_expired_otps(); to clean up old OTPs',
        statsQuery: 'SELECT * FROM otp_statistics; to view statistics'
      }
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error: any) {
    console.error('OTP test error:', error);
    return NextResponse.json({ 
      error: error.message || 'Test failed',
      stack: error.stack
    }, { status: 500 });
  }
}

// Test OTP cleanup
export async function POST(req: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    // Run cleanup function
    const { data, error } = await supabase.rpc('cleanup_expired_otps');
    
    if (error) {
      throw error;
    }
    
    // Get updated statistics
    const { data: stats } = await supabase
      .from('otp_statistics')
      .select('*');
    
    return NextResponse.json({
      success: true,
      message: 'Cleanup completed',
      statistics: stats || []
    });
    
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ 
      error: error.message || 'Cleanup failed'
    }, { status: 500 });
  }
} 
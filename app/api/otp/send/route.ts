import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WATI_ACCESS_TOKEN = process.env.WATI_ACCESS_TOKEN!;
const WATI_API_ENDPOINT = process.env.WATI_API_ENDPOINT!;

function generateOtp(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString().slice(0, length);
}

// Normalize phone numbers for consistent handling
function normalizePhoneNumber(phone: string): { 
  e164: string,      // +919876543210 (for DB storage)
  watiFormat: string // 919876543210 (for WATI API)
} {
  // Remove all non-digit characters
  let digitsOnly = phone.replace(/[^\d]/g, '');
  
  // Handle Indian numbers without country code
  if (digitsOnly.length === 10 && !digitsOnly.startsWith('91')) {
    digitsOnly = '91' + digitsOnly;
  }
  
  return {
    e164: '+' + digitsOnly,
    watiFormat: digitsOnly
  };
}

export async function POST(req: NextRequest) {
  try {
    const { phone, purpose, userId } = await req.json();
    
    console.log('OTP Send Request:', { phone, purpose, userId });
    console.log('Environment check:', {
      hasToken: !!WATI_ACCESS_TOKEN,
      hasEndpoint: !!WATI_API_ENDPOINT,
      endpoint: WATI_API_ENDPOINT
    });
    
    if (!phone || !purpose) {
      return NextResponse.json({ error: 'Missing phone or purpose' }, { status: 400 });
    }
    
    // Check environment variables
    if (!WATI_ACCESS_TOKEN || !WATI_API_ENDPOINT) {
      console.error('Missing Wati credentials');
      return NextResponse.json({ 
        error: 'Wati configuration missing. Please check environment variables.' 
      }, { status: 500 });
    }
    
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min expiry

    console.log('Generated OTP:', otp);

    // Normalize phone number
    const { e164, watiFormat } = normalizePhoneNumber(phone);
    
    console.log('Phone number normalized:', {
      original: phone,
      e164: e164,
      watiFormat: watiFormat
    });

    // Store OTP in DB with E164 format
    const { error: dbError } = await supabase.from('otp_verifications').insert({
      user_id: userId || null,
      mobile_number: e164, // Store in E164 format
      otp_code: otp,
      purpose,
      expires_at: expiresAt,
    });
    
    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    console.log('OTP stored in database successfully');

    // Helper function to send OTP via WATI with retry logic
    const sendWithRetry = async (payload: any, phoneFormat: string, maxRetries = 2) => {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          console.log(`WATI send attempt ${attempt + 1} of ${maxRetries + 1}`);
          
          const response = await fetch(
            `${WATI_API_ENDPOINT}/api/v2/sendTemplateMessage?whatsappNumber=${phoneFormat}`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload),
              signal: AbortSignal.timeout(10000) // 10 second timeout
            }
          );
          
          const responseText = await response.text();
          let data;
          
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            console.error('Failed to parse WATI response:', responseText);
            data = { rawResponse: responseText };
          }
          
          console.log(`WATI attempt ${attempt + 1} response:`, {
            status: response.status,
            data: data
          });
          
          // Check for success
          if (response.ok || data.result === true || data.success === true) {
            return { success: true, data };
          }
          
          // If phone not on WhatsApp, don't retry
          if (data.validWhatsAppNumber === false) {
            return { 
              success: false, 
              error: 'This phone number is not registered on WhatsApp. Please ensure WhatsApp is installed and active on this number.',
              code: 'PHONE_NOT_ON_WHATSAPP',
              data 
            };
          }
          
          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            const waitTime = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        } catch (error) {
          console.error(`WATI attempt ${attempt + 1} failed:`, error);
          
          // On final attempt, throw the error
          if (attempt === maxRetries) {
            return { 
              success: false, 
              error: 'Failed to connect to WhatsApp service. Please try again later.',
              code: 'WATI_CONNECTION_ERROR',
              details: error
            };
          }
        }
      }
      
      return { 
        success: false, 
        error: 'Failed to send OTP after multiple attempts. Please try again.',
        code: 'MAX_RETRIES_EXCEEDED'
      };
    };

    // Send OTP via Wati with retry
    const watiPayload = {
      template_name: 'otp',
      broadcast_name: 'otp',
      parameters: [
        {
          name: '1',
          value: otp
        }
      ]
    };

    console.log('Sending OTP via WATI to:', watiFormat);
    
    const result = await sendWithRetry(watiPayload, watiFormat);
    
    if (result.success) {
      console.log('OTP sent successfully!');
      return NextResponse.json({ 
        success: true, 
        message: 'OTP sent successfully via WhatsApp',
        otp: process.env.NODE_ENV === 'development' ? otp : undefined, // Show OTP in dev mode for testing
        details: result.data
      });
    }
    
    // If first format fails, try alternative format
    if (result.code === 'WATI_CONNECTION_ERROR' || result.code === 'MAX_RETRIES_EXCEEDED') {
      console.log('Trying alternative WATI message format...');
      
      const altPayload = {
        receivers: [watiFormat],
        template: {
          name: 'otp',
          language: {
            code: 'en',
            policy: 'deterministic'
          },
          components: [
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: otp
                }
              ]
            }
          ]
        }
      };
      
      const altResult = await sendWithRetry(altPayload, watiFormat, 1); // Only 1 retry for alt format
      
      if (altResult.success) {
        console.log('OTP sent successfully with alternative format!');
        return NextResponse.json({ 
          success: true, 
          message: 'OTP sent successfully via WhatsApp',
          otp: process.env.NODE_ENV === 'development' ? otp : undefined,
          details: altResult.data
        });
      }
    }
    
    // Both formats failed
    console.error('Failed to send OTP via WATI:', result);
    return NextResponse.json({ 
      error: result.error,
      code: result.code,
      hint: 'Please ensure your phone number is registered on WhatsApp and try again.'
    }, { status: 400 });
    
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return NextResponse.json({ 
      error: err.message || 'Internal error',
      code: 'INTERNAL_ERROR',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const WATI_ACCESS_TOKEN = process.env.WATI_ACCESS_TOKEN!;
const WATI_API_ENDPOINT = process.env.WATI_API_ENDPOINT!;

function generateOtp(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString().slice(0, length);
}

export async function POST(req: NextRequest) {
  try {
    const { phone, purpose, userId } = await req.json();
    
    logger.log('OTP Send Request:', { phone, purpose, userId });
    logger.log('Environment check:', {
      hasToken: !!WATI_ACCESS_TOKEN,
      hasEndpoint: !!WATI_API_ENDPOINT,
      endpoint: WATI_API_ENDPOINT
    });
    
    if (!phone || !purpose) {
      return NextResponse.json({ error: 'Missing phone or purpose' }, { status: 400 });
    }
    
    // Check environment variables
    if (!WATI_ACCESS_TOKEN || !WATI_API_ENDPOINT) {
      logger.error('Missing Wati credentials');
      return NextResponse.json({ 
        error: 'Wati configuration missing. Please check environment variables.' 
      }, { status: 500 });
    }
    
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min expiry

    logger.log('Generated OTP: [REDACTED]');

    // Store OTP in DB with user_id if provided
    const { error: dbError } = await supabase.from('otp_verifications').insert({
      user_id: userId || null,
      mobile_number: phone,
      otp_code: otp,
      purpose,
      expires_at: expiresAt,
    });
    
    if (dbError) {
      logger.error('Database error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    logger.log('OTP stored in database successfully');

    // Clean phone number for Wati - remove + and any non-numeric characters
    // Wati expects phone numbers in format like "919876543210" (country code + number, no +)
    let cleanPhone = phone.replace(/[^\d]/g, ''); // Remove all non-numeric characters
    
    // If phone doesn't start with country code, assume it's an Indian number
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }
    
    // Also try without country code
    const phoneWithoutCountryCode = cleanPhone.replace(/^91/, '');
    
    logger.log('Phone number formats:', {
      original: '[PHONE]',
      cleaned: '[PHONE]',
      withoutCountryCode: '[PHONE]'
    });
    
    logger.log('Cleaned phone number for Wati: [PHONE]');
    
    // Send OTP via Wati
    logger.log('Cleaned phone number for Wati: [PHONE]');
    
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

    logger.log('Wati API Request - Full Details:', {
      url: `${WATI_API_ENDPOINT}/api/v1/sendTemplateMessage/${cleanPhone}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [REDACTED]'
      },
      body: {
        ...watiPayload,
        parameters: [{ name: 'otp', value: '[REDACTED]' }]
      }
    });

    const watiResponse = await fetch(`${WATI_API_ENDPOINT}/api/v2/sendTemplateMessage?whatsappNumber=${cleanPhone}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(watiPayload)
    });
    
    const responseText = await watiResponse.text();
    let watiData;
    
    try {
      watiData = JSON.parse(responseText);
    } catch (e) {
      logger.error('Failed to parse Wati response:', responseText);
      watiData = { rawResponse: responseText };
    }
    
    logger.log('Wati API Response:', {
      status: watiResponse.status,
      result: watiData.result,
      messageId: watiData.messageId
    });
    
    // Check various success indicators
    if (watiResponse.status === 200 || watiResponse.status === 201 || 
        (watiData && (watiData.result === true || watiData.success === true))) {
      logger.log('OTP sent successfully!');
      return NextResponse.json({ 
        success: true, 
        message: 'OTP sent successfully via WhatsApp',
        otp: process.env.NODE_ENV === 'development' ? otp : undefined, // Show OTP in dev mode for testing
        details: watiData
      });
    }
    
    // If the response indicates invalid phone number, provide helpful error
    if (watiData && watiData.validWhatsAppNumber === false) {
      logger.error('Invalid WhatsApp number:', '[PHONE]');
      return NextResponse.json({ 
        error: 'Invalid WhatsApp number. Please ensure the number is registered on WhatsApp.',
        details: watiData,
        phoneFormat: cleanPhone
      }, { status: 400 });
    }
    
    // Try alternative format if first one fails
    if (!watiResponse.ok || (watiData && watiData.result === false)) {
      logger.log('Trying alternative Wati format...');
      
      // Format 2: Alternative format with receivers array
      const altPayload = {
        receivers: [cleanPhone],
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
      
      const altRes = await fetch(`${WATI_API_ENDPOINT}/api/v2/sendTemplateMessage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(altPayload),
      });
      
      const altData = await altRes.json();
      logger.log('Alternative format response:', altData);
      
      if (altRes.ok && altData.result === true) {
        return NextResponse.json({ 
          success: true, 
          message: 'OTP sent successfully via WhatsApp (alt format)',
          otp: process.env.NODE_ENV === 'development' ? otp : undefined,
          details: altData
        });
      }
      
      logger.error('Both Wati formats failed:', { watiData, altData });
      return NextResponse.json({ 
        error: 'Failed to send OTP via WhatsApp', 
        details: { 
          primary: watiData, 
          alternative: altData,
          hint: 'Please check if the phone number is registered on WhatsApp'
        }
      }, { status: 500 });
    }

    return NextResponse.json({ 
      error: 'Failed to send OTP via WhatsApp', 
      details: watiData 
    }, { status: 500 });
    
  } catch (err: any) {
    logger.error('Send OTP error:', err);
    return NextResponse.json({ 
      error: err.message || 'Internal error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}

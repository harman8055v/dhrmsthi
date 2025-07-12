# Wati WhatsApp OTP Migration Guide

This guide documents the migration from Twilio SMS OTP to Wati WhatsApp OTP for DharmaSaathi.

## Overview

The application has been migrated from using Supabase's built-in phone authentication (which uses Twilio for SMS) to a custom WhatsApp OTP solution using Wati.

## Key Changes

### 1. Backend API Endpoints

Created new API endpoints for OTP operations:

- **`/api/otp/send`** - Sends OTP via Wati WhatsApp
  - Generates 6-digit OTP
  - Stores in `otp_verifications` table
  - Sends via Wati WhatsApp API v2
  - **Important**: Phone number must be passed as query parameter

- **`/api/otp/verify`** - Verifies OTP
  - Validates OTP against database
  - Checks expiry (10 minutes)
  - Tracks verification attempts (max 5)
  - Marks as verified on success

### 2. Wati API Configuration

**Environment Variables Required:**
```env
WATI_ACCESS_TOKEN=your_access_token_here
WATI_API_ENDPOINT=https://live-mt-server.wati.io/your_tenant_id
```

**API Details:**
- Endpoint: `{WATI_API_ENDPOINT}/api/v2/sendTemplateMessage?whatsappNumber={phone}`
- Method: POST
- Phone number format: Country code + number (e.g., "917986057181" for India)
- Template name: "otp"
- Parameter: `{"name": "1", "value": "123456"}`

**Important Notes:**
- Use API v2 (not v1)
- Phone number must be passed as query parameter, not in request body
- Do not include "Bearer" prefix in the WATI_ACCESS_TOKEN environment variable
- Phone numbers should not include "+" prefix

### 3. Database Schema

The `otp_verifications` table was already created with this structure:
```sql
- id (UUID)
- user_id (UUID, optional)
- mobile_number (TEXT)
- otp_code (TEXT)
- purpose (TEXT)
- expires_at (TIMESTAMP)
- created_at (TIMESTAMP)
- verified_at (TIMESTAMP)
- attempts (INTEGER)
```

### 4. Environment Variables Required

Add these to your `.env.local`:
```
WATI_ACCESS_TOKEN=your_wati_access_token_here
WATI_API_ENDPOINT=your_wati_api_endpoint_here
```

**Note:** Do NOT include "Bearer" in the access token value.

## Wati Template Setup

You need to create a WhatsApp template named "otp" in your Wati account with:
- Template name: `otp`
- Parameter: `otp_code` (or whatever parameter name you use in the template)
- Example template text: "Your DharmaSaathi verification code is: {{otp_code}}"

## Testing the Integration

1. **Test OTP Send:**
   ```bash
   curl -X POST http://localhost:3000/api/otp/send \
     -H "Content-Type: application/json" \
     -d '{"phone": "+911234567890", "purpose": "signup"}'
   ```

2. **Test OTP Verify:**
   ```bash
   curl -X POST http://localhost:3000/api/otp/verify \
     -H "Content-Type: application/json" \
     -d '{"phone": "+911234567890", "otp": "123456", "purpose": "signup"}'
   ```

## Removed Supabase Phone Auth

The following Supabase phone auth methods have been completely removed:
- `supabase.auth.signInWithOtp({ phone })`
- `supabase.auth.verifyOtp({ phone, token, type })`
- `supabase.auth.updateUser({ phone })`

## Important Notes

1. **Phone-only Signup:** When users sign up with only a phone number, we create a temporary email (`{phone}@phone.dharmasaathi.com`) and password to maintain compatibility with Supabase Auth.

2. **OTP Expiry:** OTPs expire after 10 minutes. This can be adjusted in `/api/otp/send/route.ts`.

3. **Rate Limiting:** Consider implementing rate limiting on the OTP endpoints to prevent abuse.

4. **Supabase Settings:** You should disable phone authentication in your Supabase project settings to avoid confusion.

## Troubleshooting

### Common Errors

1. **500 Error when sending OTP:**
   - Check if environment variables are set correctly
   - Verify Wati API credentials
   - Check if the template name "otp" exists in Wati
   - Check server logs for detailed error messages

2. **OTP not received:**
   - Ensure the phone number is in WhatsApp
   - Check if the number format is correct (E.164 format)
   - Verify Wati account has sufficient credits

3. **Invalid OTP error:**
   - Check if OTP has expired (10 minutes)
   - Ensure the purpose matches between send and verify
   - Verify the phone number format matches

## Future Enhancements

1. Add rate limiting to prevent OTP spam
2. Implement OTP attempt limits (currently tracked but not enforced)
3. Add analytics for OTP success/failure rates
4. Consider adding backup SMS option for users without WhatsApp 
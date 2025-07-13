# Mobile OTP Login Fix Guide

## 🎉 What We Fixed

### 1. **Phone Number Normalization**
- Added consistent phone number handling across the system
- Database stores numbers in E.164 format (+919876543210)
- WATI API receives numbers without + (919876543210)
- Automatically adds +91 for 10-digit Indian numbers

### 2. **Improved Error Messages**
- Specific error codes for different failure scenarios:
  - `OTP_EXPIRED`: OTP has expired (10-minute window)
  - `TOO_MANY_ATTEMPTS`: Too many failed attempts (10 in 30 minutes)
  - `INVALID_OTP`: Wrong OTP code entered
  - `NO_OTP_FOUND`: No OTP exists for this number
  - `PHONE_NOT_ON_WHATSAPP`: Number not registered on WhatsApp

### 3. **WATI API Retry Logic**
- Automatic retry with exponential backoff (1s, 2s, 4s)
- Tries alternative message format if first fails
- 10-second timeout per request
- Clear error messages for connection issues

### 4. **Reliable Session Creation**
- Primary: Magic link generation for instant session
- Fallback: Temporary password method
- localStorage backup for edge cases
- Improved auth-loading screen handling

### 5. **Database Cleanup**
- Automatic cleanup of expired OTPs
- Indexes for faster lookups
- Statistics view for monitoring

## 🧪 Testing the OTP System

### Development Testing Endpoint

```bash
# Check OTP system status (development only)
curl http://localhost:3000/api/otp/test

# Run manual cleanup
curl -X POST http://localhost:3000/api/otp/test
```

### Test Scenarios

#### 1. **Happy Path - New User Signup**
1. Enter phone number with country code (e.g., +919876543210)
2. Click "Send OTP"
3. Check WhatsApp for 6-digit code
4. Enter OTP within 10 minutes
5. Should redirect to onboarding

#### 2. **Happy Path - Existing User Login**
1. Click "Mobile" tab in login
2. Enter registered phone number
3. Get OTP on WhatsApp
4. Enter OTP
5. Should redirect to dashboard

#### 3. **Error Scenarios to Test**
- **Expired OTP**: Wait 11 minutes before entering OTP
- **Wrong OTP**: Enter incorrect 6-digit code
- **No WhatsApp**: Use a number without WhatsApp
- **Too Many Attempts**: Try wrong OTP 10+ times

### Phone Number Formats to Test
```
✅ +919876543210  (Full E.164)
✅ 9876543210     (Indian without code)
✅ 919876543210   (Without +)
❌ 09876543210    (With leading 0)
❌ 98765 43210    (With spaces)
```

## 🔍 Troubleshooting

### "Stuck on Verifying"
1. Check browser console for errors
2. Verify WATI credentials in .env
3. Check if OTP was stored in database
4. Look for session creation errors

### "Invalid OTP" Errors
1. Check if OTP expired (10-minute window)
2. Verify phone number format matches
3. Check attempt count (max 10 in 30 mins)
4. Ensure OTP is exactly 6 digits

### "Failed to Send OTP"
1. Check WATI API credentials
2. Verify phone has WhatsApp installed
3. Check WATI dashboard for errors
4. Look at server logs for retry attempts

## 📊 Database Queries

### Check Recent OTPs
```sql
SELECT * FROM otp_verifications 
ORDER BY created_at DESC 
LIMIT 10;
```

### View OTP Statistics
```sql
SELECT * FROM otp_statistics;
```

### Manual Cleanup
```sql
SELECT cleanup_expired_otps();
```

### Check Specific Phone
```sql
SELECT * FROM otp_verifications 
WHERE mobile_number = '+919876543210'
ORDER BY created_at DESC;
```

## 🚀 Production Deployment

1. **Run Database Migration**
```bash
psql $DATABASE_URL < scripts/fix-otp-verification-cleanup.sql
```

2. **Environment Variables**
```env
WATI_ACCESS_TOKEN=your_token
WATI_API_ENDPOINT=https://your-instance.wati.io
NEXT_PUBLIC_APP_URL=https://dharmasaathi.com
```

3. **Monitor After Deployment**
- Check `/api/otp/test` endpoint (dev only)
- Monitor WATI dashboard for delivery rates
- Check error logs for specific error codes
- Run cleanup function periodically

## 🎯 Success Metrics

- OTP delivery rate > 95%
- Verification success rate > 90%
- Average verification time < 30 seconds
- Zero "stuck on verifying" issues
- Clear error messages for all failures

## 🔐 Security Notes

- OTPs expire after 10 minutes
- Max 10 attempts per 30 minutes
- Phone numbers stored in E.164 format
- Cleanup runs hourly (if pg_cron enabled)
- Test endpoint only works in development 
# Password Reset Testing Guide

## Quick Test Steps

### 1. Test When Already Logged In

1. **Log in to your account first**
   - Go to http://localhost:3001
   - Log in with your credentials

2. **Request Password Reset**
   - Open auth dialog and click "Forgot Password?"
   - Enter your email
   - Check your email for the reset link

3. **Click the Reset Link**
   - Click the link while still logged in
   - Watch the console logs

4. **Expected Behavior**
   - Should see: `[ResetPassword] User is logged in, signing out first...`
   - Page will reload automatically
   - Then show the password reset form

### 2. Test When Not Logged In

1. **Log out completely**
   - Click logout or clear cookies

2. **Request and click reset link**
   - Follow same steps as above

3. **Expected Behavior**
   - Should directly show password reset form
   - No need to sign out first

## Console Logs to Watch

```javascript
// Good flow:
[ResetPassword] Starting password reset handler...
[ResetPassword] Recovery params: { hasAccessToken: true, type: 'recovery', ... }
[ResetPassword] User is logged in, signing out first... // (if logged in)
[ResetPassword] Processing recovery link...
// Page reloads
[ResetPassword] Auth event: PASSWORD_RECOVERY
[ResetPassword] PASSWORD_RECOVERY event received!

// Problem indicators:
[ResetPassword] Recovery params: { hasAccessToken: false, type: null, ... }
[ResetPassword] No session and no recovery params
```

## URL Structure

The reset link should look like one of these:
- `https://dharmasaathi.com/reset-password?access_token=xxx&type=recovery&...`
- `https://dharmasaathi.com/reset-password#access_token=xxx&type=recovery&...`

Note the difference: `?` (query params) vs `#` (hash params)

## Troubleshooting

1. **Still seeing "Verifying..." forever?**
   - Check if URL has recovery parameters
   - Clear all cookies and try again
   - Check Supabase dashboard for redirect URL configuration

2. **Getting "already logged in" error?**
   - The new code should handle this automatically
   - If not, manually log out and try again

3. **No PASSWORD_RECOVERY event?**
   - Check if useAuth hook is ignoring the event (it should)
   - Verify URL has correct parameters
   - Try in incognito mode

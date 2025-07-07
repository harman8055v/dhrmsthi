# Email + Password Authentication Guide

## Overview
This guide documents the simplified authentication system using email + password instead of mobile OTP verification.

## Authentication Flow

### Sign Up
1. User provides:
   - First Name
   - Last Name  
   - Email (for authentication)
   - Mobile Number (collected but not verified)
   - Password (min 6 characters)
   - Confirm Password

2. System creates:
   - Supabase auth user with email/password
   - User profile with default values
   - Automatic login after successful signup

### Sign In
1. User provides:
   - Email
   - Password

2. System:
   - Authenticates via Supabase
   - Creates profile if missing
   - Redirects to dashboard

## Default Profile Values
When a user signs up, these defaults are set:

```javascript
{
  onboarding_completed: true,    // Skip onboarding
  mobile_verified: false,        // No verification needed
  email_verified: false,
  
  // Basic defaults
  gender: 'Male',
  birthdate: '25 years ago',     // Default age 25
  height_ft: 5,
  height_in: 6,
  education: 'Graduate',
  profession: 'Professional',
  diet: 'Vegetarian',
  marital_status: 'Single',
  annual_income: '5-10 Lakhs',
  
  // Empty arrays
  spiritual_org: [],
  daily_practices: [],
  user_photos: [],
  
  // Scoring and limits
  profile_score: 5,
  super_likes_count: 5,
  swipe_count: 50,
  message_highlights_count: 3
}
```

## Files Modified

### 1. Sign Up Page (`app/signup/page.tsx`)
- Removed OTP sending logic
- Added password fields
- Direct profile creation on signup
- Auto-login after signup

### 2. Login Page (`app/login/page.tsx`)
- Removed OTP verification
- Simple email/password login
- Profile creation for existing auth users

### 3. Auth Dialog (`components/auth-dialog.tsx`)
- Removed all mobile OTP code
- Simplified to email/password only
- Cleaner UI without auth method selection

### 4. Dashboard (`app/dashboard/page.tsx`)
- Already handles profile creation
- No changes needed

## Files Deleted
- `app/verify-otp/page.tsx` - OTP verification page
- `app/verify-mobile/page.tsx` - Mobile verification page
- `scripts/test-skip-onboarding.sql` - OTP test script
- `SKIP_ONBOARDING_GUIDE.md` - OTP documentation

## Database Considerations

### Mobile Number Storage
- Mobile numbers are still collected during signup
- Stored in the `phone` field of users table
- Not verified (`mobile_verified` = false)
- Can be updated later in profile settings

### No Breaking Changes
- Existing users unaffected
- Database schema unchanged
- All existing features work as before

## Testing

### Test Sign Up:
1. Go to `/signup`
2. Fill all fields including mobile
3. Submit form
4. Should auto-login and redirect to dashboard

### Test Login:
1. Go to `/login`
2. Enter email and password
3. Submit form
4. Should redirect to dashboard

### Test Auth Dialog:
1. Click "Sign In" on homepage
2. Both signup and login tabs should work
3. Password reset flow available

## Security Notes
- Passwords stored securely by Supabase
- Minimum 6 character password requirement
- Password confirmation on signup
- Standard forgot password flow via email

## Future Enhancements
1. Email verification (optional)
2. Social login providers
3. Two-factor authentication
4. Stronger password requirements

## Troubleshooting

### Common Issues and Solutions

#### 1. "Authentication not ready" Error
**Problem:** AuthContext trying to wait for authentication that doesn't exist yet  
**Solution:** Fixed by removing `waitForAuthReady` and using simple session check

#### 2. Profile Creation Errors
**Problem:** Empty error object {} when creating profile  
**Solution:** Enhanced error handling to show actual database errors:
- Duplicate email constraint violations
- Duplicate phone constraint violations
- Missing required fields

#### 3. Database Constraints
**Problem:** Strict constraints preventing profile creation  
**Solution:** Run `scripts/fix-email-auth-issues.sql` to:
- Add missing phone column
- Make fields nullable that should be optional
- Clean up orphaned auth users
- Create safe profile creation function

#### 4. Email Already Registered
**Problem:** User trying to sign up with existing email  
**Solution:** Clear error messages guide user to login instead

#### 5. Onboarding Still Shows After Signup
**Problem:** Users redirected to onboarding even though we skip it  
**Solution:** Field name mismatch between `onboarding_completed` and `is_onboarded`
- Set both fields to `true` during signup
- Also set `onboarding_stage` to `null`
- Run `scripts/fix-onboarding-field-mismatch.sql` to fix existing users

### Debug Steps
1. Check Supabase logs for detailed errors
2. Run diagnostic queries from `fix-email-auth-issues.sql`
3. Verify auth.users and public.users are in sync
4. Check browser console for detailed error messages

## Summary

The authentication system has been successfully simplified from mobile OTP to email + password:

✅ **What's Changed:**
- Removed all OTP verification flows
- Switched to standard email/password authentication
- Mobile numbers collected but not verified
- Users skip onboarding and go directly to dashboard
- Default profile values ensure smooth experience

✅ **Benefits:**
- Simpler user experience
- Faster signup process
- No SMS costs or delays
- Standard password reset via email
- Familiar authentication pattern

✅ **Files Cleaned Up:**
- Deleted OTP verification pages
- Removed OTP-related SQL scripts
- Updated all signup/login flows
- Cleaned middleware of mobile checks

The system is now ready for use with straightforward email + password authentication! 
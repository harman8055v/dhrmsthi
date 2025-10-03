# Password Reset Redirect Update

## Change Made
Updated the password reset success redirect from `/?reset=success&login=1` to `/login`

## File Modified
`/app/(auth)/reset-password/ResetPasswordClient.tsx` - Line 105

## Reason for Change
The URL parameters (`?reset=success&login=1`) were causing problems with the authentication flow. A clean redirect to `/login` is simpler and avoids any parameter parsing issues.

## Before
```typescript
router.push('/?reset=success&login=1')
```

## After
```typescript
router.push('/login')
```

## User Flow After Change
1. User enters new password
2. Clicks "Update Password"
3. Sees success message: "Your password has been reset successfully!"
4. After 2 seconds, redirected to `/login` page
5. User can log in with their new password

## Benefits
- Cleaner URL without parameters
- No parameter parsing issues
- Direct path to login page after password reset
- Simpler user experience

This change was made with explicit user permission to resolve issues with the parameter-based redirect.

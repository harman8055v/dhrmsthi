# Multiple Supabase Client Instances Fix

## Issues Fixed

### 1. **Multiple GoTrueClient Instances Warning**
- **Cause**: `app/native-bridge.tsx` was creating its own Supabase client using `createClientComponentClient()`
- **Fix**: Changed to use the shared client from `@/lib/supabase`
- **Result**: No more multiple instances warning

### 2. **"User is logged in but no reset code" Error**
- **Scenario**: User visits `/reset-password` directly while already logged in
- **Old Behavior**: Showed error message
- **New Behavior**: Signs out the user and redirects to login page
- **Result**: Clean flow without confusing error messages

## Changes Made

### `app/native-bridge.tsx`
```typescript
// Before
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
const supabase = createClientComponentClient();

// After
import { supabase } from "@/lib/supabase";
```

### `app/(auth)/reset-password/ResetPasswordClient.tsx`
```typescript
// Now handles logged-in users visiting reset page directly
if (session && !code) {
  console.log('[ResetPassword] User is logged in but no reset code - redirecting to login')
  await supabase.auth.signOut()
  router.push('/login')
  return
}
```

## Benefits
- Single Supabase client instance throughout the app
- No more console warnings about multiple instances
- Better UX when users accidentally visit reset page while logged in
- Consistent session management across all components

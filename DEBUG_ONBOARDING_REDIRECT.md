# Debug Guide: Finding the Onboarding Redirect

## Current Status

We've removed ALL `router.push("/onboarding")` calls from:
- ✅ Dashboard pages
- ✅ Component files
- ✅ Auth loading screen
- ✅ Middleware doesn't redirect to onboarding

We've changed signup flow to:
- ✅ Use `window.location.href` instead of `router.push`
- ✅ Increased delay to 3 seconds before redirect
- ✅ Set both `onboarding_completed: true` and `is_onboarded: true`

## Debug Steps

1. **Open Chrome DevTools** before signing up
2. Go to **Network** tab
3. Check **Preserve log**
4. Sign up and watch for:
   - Any 302/301 redirects
   - Any requests to `/onboarding`

## Possible Causes

1. **Supabase Row Level Security (RLS)**
   - Profile might not be visible immediately after creation
   - Dashboard loads, can't find profile, redirects

2. **Caching Issue**
   - Browser might be caching old JavaScript
   - Try: Cmd+Shift+R (hard refresh)
   - Try: Incognito mode

3. **Database Trigger**
   - Check if there's a database trigger resetting onboarding fields

## Quick Test

Try this in the browser console after signup:
```javascript
const { data: { user } } = await supabase.auth.getUser()
console.log('User:', user)

const { data: profile } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.id)
  .single()
  
console.log('Profile:', profile)
console.log('onboarding_completed:', profile?.onboarding_completed)
console.log('is_onboarded:', profile?.is_onboarded)
```

## Nuclear Option

If still redirecting, try this SQL in Supabase:
```sql
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(raw_app_meta_data, '{onboarding_completed}', 'true')
WHERE id = 'YOUR_USER_ID';
``` 
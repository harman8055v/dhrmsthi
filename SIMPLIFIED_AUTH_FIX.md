# Simplified Auth Fix

## The Only Real Change Needed

**Problem**: `createClientComponentClient` from auth helpers was interfering with password reset.

**Solution**: Use standard `createClient` from '@supabase/supabase-js' in `lib/supabase.ts`

## That's It

Everything else works as originally designed in the single source of truth:
- Password reset creates a session (normal Supabase behavior)
- Fire and forget password update
- Redirect to login after success
- User logs in with new password

## What I Removed (Unnecessary Complications)
- ❌ Checking if on password reset page in auth hook
- ❌ Session storage flags
- ❌ Signing out after password reset
- ❌ Special handling in login page
- ❌ Complicated middleware logic

## Current State
- Standard Supabase client (no auth helpers)
- Simple middleware that just passes everything through
- Password reset works exactly as documented
- No special cases or workarounds needed

The password reset was already well-designed. The only issue was the auth helpers interfering.

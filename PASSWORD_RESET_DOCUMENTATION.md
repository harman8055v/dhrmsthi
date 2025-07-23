# 🚨 PASSWORD RESET IMPLEMENTATION - READ BEFORE ANY CHANGES

## ⚠️ CRITICAL: This functionality has been fixed 5+ times. DO NOT BREAK IT AGAIN!

## Working Flow Overview
1. **User requests reset** → `auth-dialog.tsx` calls `resetPasswordForEmail()`
2. **Email sent** → Contains link to `/reset-password?code=...`
3. **User clicks link** → Supabase processes and fires `PASSWORD_RECOVERY` event
4. **ResetPasswordClient** → Listens for event, shows form, calls `updateUser()`

---

## 🔒 Key Files - DO NOT MODIFY WITHOUT UNDERSTANDING

### 1. `hooks/use-auth.ts`
**CRITICAL**: Must ignore `PASSWORD_RECOVERY` events to prevent race conditions

```typescript
// This MUST remain to prevent global hook from stealing the event
if (event === 'PASSWORD_RECOVERY') {
  console.log('[useAuth] Ignoring PASSWORD_RECOVERY event - handled by reset page')
  return
}
```

### 2. `app/(auth)/reset-password/ResetPasswordClient.tsx`
**KEEP SIMPLE**: Follows Supabase docs exactly

```typescript
// ONLY listen for PASSWORD_RECOVERY event - nothing else!
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      setShowForm(true) // Show the form
    }
  })
  return () => subscription.unsubscribe()
}, [])

// ONLY call updateUser when form submitted - nothing else!
const { data, error } = await supabase.auth.updateUser({
  password: newPassword
})
```

### 3. `components/auth-dialog.tsx`
**HARDCODED URL**: Uses production URL for redirectTo

```typescript
await supabase.auth.resetPasswordForEmail(email, { 
  redirectTo: 'https://dharmasaathi.com/reset-password' 
})
```

---

## ❌ What BREAKS the Password Reset

### 1. **Global Auth Hook Interference**
- If `useAuth()` processes `PASSWORD_RECOVERY` events
- **Fix**: Always ignore `PASSWORD_RECOVERY` in global hook

### 2. **Overcomplicating URL Parsing**
- Adding PKCE code exchanges
- Parsing URL parameters manually
- Complex session handling
- **Fix**: ONLY listen for `PASSWORD_RECOVERY` event

### 3. **Dynamic Redirect URLs**
- Using `window.location.origin` for redirectTo
- **Fix**: Always use hardcoded production URL

### 4. **Multiple Auth Listeners**
- Race conditions between components
- **Fix**: Only reset component should handle `PASSWORD_RECOVERY`

---

## ✅ Working Debug Flow

When password reset works correctly, debug logs show:
```
1. Component mounted, setting up auth listener...
2. Full URL: https://dharmasaathi.com/reset-password?code=xyz...
3. Auth event: PASSWORD_RECOVERY, Session: present
4. PASSWORD_RECOVERY event received! Showing form...
5. [User enters password and submits]
6. Updating password...
7. Password updated successfully!
8. [Redirect to login]
```

---

## 🛠 Supabase Configuration

### Email Template
- Must use `{{ .RedirectTo }}` (not `{{ .SiteURL }}`)
- Template: `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery`

### Redirect URLs
- Dashboard must include: `https://dharmasaathi.com/reset-password`

### Flow Type
- Project configured for **implicit/token hash flow** for password reset
- **NOT** PKCE flow (that's for regular auth)

---

## 🚨 REMINDER: STICK TO SUPABASE DOCS

The official Supabase documentation is simple and works:

```typescript
// Step 1: Send email
await supabase.auth.resetPasswordForEmail('user@email.com')

// Step 2: Listen for event and update password
useEffect(() => {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event == "PASSWORD_RECOVERY") {
      const newPassword = prompt("Enter new password")
      await supabase.auth.updateUser({ password: newPassword })
    }
  })
}, [])
```

**DO NOT DEVIATE FROM THIS PATTERN!**

---

## 📝 Change History
- Fixed 5+ times due to overcomplication
- Root cause: Global auth hook consuming events
- Solution: Ignore `PASSWORD_RECOVERY` in global hook + keep reset component simple

---

## 🔥 FINAL WARNING
**Before making ANY changes to auth flow:**
1. Read this documentation
2. Understand the current working implementation
3. Test password reset thoroughly
4. Remember: SIMPLE = WORKING

**If it ain't broke, DON't fix it!** 🙏 
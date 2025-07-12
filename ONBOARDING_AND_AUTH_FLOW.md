# DharmaSaathi Onboarding, Signup, and Authentication Flow

---

**This file documents every granular detail about how onboarding, signup, and login are set up in the current codebase.**

> **NOTE:** Do not edit or update this file without explicit permission from the project owner.

---

## 1. Overview

The onboarding and authentication system is built using Supabase for authentication (email/password and phone/OTP), with a multi-stage onboarding process that collects user profile data. The system supports:
- Email/password signup and login
- Phone/OTP signup and login
- Multi-stage onboarding (profile completion)
- Referral code integration
- Error handling and validation at every step
- User state management via Supabase and localStorage

---

## 2. Signup Flow

### 2.1. Email/Password Signup
- **Component:** `components/signup-section.tsx`, `components/auth-dialog.tsx`
- **API:** `supabase.auth.signUp({ email, password, options: { data: { ...profile } } })`
- **Data persisted:**
  - Email, password, first name, last name, full name, phone (optional)
  - Referral code (if present) is stored in `localStorage` as `signupData`
- **On success:**
  - User is redirected to `/auth-loading?userId=...&isNew=true`
  - Optionally, a user profile is created in the `users` table

### 2.2. Phone/OTP Signup
- **Component:** `components/auth-dialog.tsx`, `components/onboarding/stages/seed-stage.tsx`
- **OTP Delivery:** OTP is delivered **via WhatsApp** using the custom `/api/otp/send` route which integrates with **WATI**. (SMS fallback coming soon.)
- **API:** `supabase.auth.signInWithOtp({ phone, options: { shouldCreateUser: true, data: { ...profile } } })`
- **OTP Verification:**
  - `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`
  - On success, user profile is upserted in the `users` table
  - Handles duplicate/exists errors gracefully

### 2.3. Validation
- All fields are validated for presence and format (email regex, password strength, phone format)
- Errors are shown inline in the UI

---

## 3. Login Flow

### 3.1. Email/Password Login
- **Component:** `components/auth-dialog.tsx`
- **API:** `supabase.auth.signInWithPassword({ email, password })`
- **On success:**
  - User is redirected to `/auth-loading?userId=...&isNew=false`

### 3.2. Phone/OTP Login
- **Component:** `components/auth-dialog.tsx`, `components/onboarding/stages/seed-stage.tsx`
- **OTP Delivery:** OTP is delivered **via WhatsApp** using the `/api/otp/send` route backed by WATI.
- **API:**
  - `supabase.auth.signInWithOtp({ phone })` to send OTP *(WhatsApp message)*
  - `supabase.auth.verifyOtp({ phone, token, type: 'sms' })` to verify
- **On success:**
  - User is redirected to `/auth-loading?userId=...&isNew=false`

### 3.3. Password Reset
- **API:** `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
- **Redirect:** `/reset-password?email=...`

### 3.4. Mobile Login Flow (OTP-only / WebView)
- **Use-case:** When a user completes OTP verification inside the mobile app’s WebView (or a special deep-link) we cannot rely on secure HTTP-only cookies for Supabase. Instead, the backend returns only the verified `userId`.
- **State flags:** The front-end sets two keys in `localStorage`:
  - `isMobileLogin` → `'true'`
  - `mobileLoginUserId` → Supabase `uuid` of the verified user.
- **Auth handling:**
  - `hooks/use-auth.ts` detects these flags synchronously and bypasses `supabase.auth.getSession()`. It fetches the user profile directly via `/api/users/profile?userId=${mobileLoginUserId}`.
  - `user` is `null`; only `profile` is populated. A computed flag `isMobileLogin` is exposed to all consumers via `useAuth()`.
- **Navigation rules:**
  - On the Dashboard, onboarding and verification redirects honour `isMobileLogin` so users without a Supabase session are still allowed after profile fetch.
- **Sign-out:**
  - `signOut()` first clears the two localStorage keys.
  - It then calls `supabase.auth.signOut()` **only** if a regular session exists. “No session” responses are treated as benign.
  - Local auth state is reset regardless, so the UI always returns to an unauthenticated state.
- **API considerations:** Many `/api/*` routes accept an optional `mobileUserId` query parameter which, when present, is authorised via server-role RLS bypass.

---

## 4. Onboarding Flow

### 4.1. Stages
- **Component:** `components/onboarding/onboarding-container.tsx`
- **Stages:**
  1. Mobile Verification (`SeedStage`)
  2. Personal Info (`StemStage`)
  3. Professional Info (`LeavesStage`)
  4. Spiritual Preferences (`PetalsStage`)
  5. About You & Photos (`FullBloomStage`)
- **Progress:** Managed by `stage` state, with validation at each step
- **Data Structure:** See `lib/types/onboarding.ts` for `OnboardingData` interface

#### 4.1.1. Mobile Number Prefill in SeedStage (NEW)
- The mobile number input in the SeedStage is now prefilled using the following priority:
  1. If `formData.phone` is set, use that.
  2. If the authenticated user has a phone, use `user.phone`.
  3. If neither is set, check `localStorage` for `signupData.mobileNumber` (set during signup).
  4. If none are available, default to an empty string.
- This ensures a smoother onboarding experience, especially for users coming from the signup flow or with an existing session.
- If the user is not authenticated but a mobile number is present (from signup), the OTP input is shown immediately and the countdown starts, skipping the send step.
- If the user is authenticated and has a phone, the input is prefilled and the form data is updated accordingly.
- This logic is implemented in `components/onboarding/stages/seed-stage.tsx` using `useEffect` and a helper function for initial value.

### 4.2. Data Handling
- Form data is initialized from Supabase user, profile, or localStorage
- On each stage, data is validated and merged
- On final submission, all data is upserted to the `users` table via Supabase
- Handles duplicate phone/email gracefully (retries upsert without phone if needed)

### 4.3. Referral Code
- If a referral code is present in `localStorage`, it is sent to `/api/referrals/signup` after onboarding completes
- **API:** `POST /api/referrals/signup` with `{ newUserId, referralCode }`
- **Backend:** Calls Supabase RPC `handle_referral_signup`

### 4.4. Error Handling
- All API errors are caught and displayed to the user
- Handles rate limits, duplicate accounts, invalid OTP, expired OTP, etc.

---

## 5. User State & Profile Management

- **User state:** Managed via Supabase session and `useProfile` hook
- **Profile upsert:** All onboarding data is upserted to the `users` table
- **Completion:** `is_onboarded` flag is set to `true` on completion
- **Redirects:**
  - If onboarding is complete, user is redirected to `/dashboard`
  - If not, user is redirected to `/onboarding`

---

## 6. Integrations

### 6.1. Supabase
- Used for all authentication (email/password, phone/OTP)
- Used for user profile storage (`users` table)
- Used for password reset

### 6.2. LocalStorage
- Used to buffer signup data between steps and across reloads
- Stores `signupData` with email, name, phone, referral code, etc.
- **Mobile login flags:**
  - `isMobileLogin` → indicates that the session was established via OTP inside the mobile app
  - `mobileLoginUserId` → the user’s UUID used to fetch profile data when no Supabase session cookie is available

### 6.3. Custom API
- `/api/referrals/signup` for referral code processing

---

## 7. Security & Privacy

- All sensitive data is validated and sanitized before submission
- Passwords are never stored in localStorage
- User data is only upserted to the database after successful verification
- Privacy policy is referenced in the onboarding UI

---

## 8. Error Handling & Edge Cases

- Duplicate phone/email: handled with retry logic
- Rate limiting: user is notified and asked to wait
- Expired/invalid OTP: user is prompted to retry
- Missing session: user is redirected to home or asked to re-authenticate

---

## 9. File References

- `components/signup-section.tsx` — Signup form and logic
- `components/auth-dialog.tsx` — Auth dialog for signup/login/OTP
- `components/onboarding/onboarding-container.tsx` — Main onboarding logic
- `components/onboarding/stages/seed-stage.tsx` — Mobile verification
- `app/onboarding/page.tsx` — Onboarding page and user/profile loading
- `lib/types/onboarding.ts` — Onboarding data types
- `hooks/use-profile.ts` — Profile and onboarding completion logic
- `app/api/referrals/signup/route.ts` — Referral API
- `components/auth-loading-screen.tsx` — Post-auth loading and redirect

---

## 10. Data Model: OnboardingData (from `lib/types/onboarding.ts`)

```
interface OnboardingData {
  phone: string | null
  mobile_verified: boolean
  email?: string
  email_verified: boolean
  gender: "Male" | "Female" | "Other" | null
  birthdate: string | null
  height_ft: number | null
  height_in: number | null
  city_id: number | null
  state_id: number | null
  country_id: number | null
  education: string | null
  profession: string | null
  annual_income: string | null
  marital_status: string | null
  diet: "Vegetarian" | "Vegan" | "Eggetarian" | "Non-Vegetarian" | null
  temple_visit_freq: "Daily" | "Weekly" | "Monthly" | "Rarely" | "Never" | null
  vanaprastha_interest: "yes" | "no" | "open" | null
  artha_vs_moksha: "Artha-focused" | "Moksha-focused" | "Balance" | null
  spiritual_org: string[]
  daily_practices: string[]
  user_photos: string[]
  ideal_partner_notes: string | null
  about_me: string | null
  favorite_spiritual_quote: string | null
}
```

---

## 11. Summary

This document captures every detail of the onboarding, signup, and authentication system as currently implemented. For any changes or updates, explicit permission from the project owner is required. 
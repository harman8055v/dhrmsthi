# DharmaSaathi On-Boarding & Authentication – July 2025

---
**This file is the single source-of-truth for how sign-up, login and on-boarding currently work in production.  All obsolete details from the pre-WhatsApp-OTP implementation have been removed.**

> If you change ANYTHING in the flow (frontend or backend) update this document immediately.

---

## 1  High-level Overview

* Supabase is still the primary auth provider (email / password, server-generated OTP sessions), but **phone verification + login now happens entirely via our own WhatsApp OTP service**.
* WhatsApp messages are sent through **WATI** (`/api/otp/send`).
* OTP codes are stored & verified in a first-party table `otp_verifications`.
* Successful phone-OTP **login** returns a real Supabase session (access / refresh token) so the web app can operate normally.
* A lightweight "mobile-login" fallback exists for edge cases where cookies cannot be set (certain in-app WebViews).
* The multi-stage on-boarding wizard writes directly to the `users` table and finishes by setting `is_onboarded = true`.

---

## 2  Sign-Up Flow

### 2.1  Email / Password

* UI: `components/signup-section.tsx` or **Auth Dialog** (Signup tab).
* API call `supabase.auth.signUp({ email, password, options: { data } })` immediately creates the auth user.
* On success the user is sent to `/auth-loading?userId=<uuid>&isNew=true` where the profile row is created if it doesn’t exist.

### 2.2  Phone / WhatsApp-OTP

1. **User enters mobile number →** frontend hits `POST /api/otp/send` with `{ phone, purpose: 'signup' }`.
   * Route generates a 6-digit code, stores a row in `otp_verifications`, and sends a WhatsApp template (`otp`) through WATI.
2. **User enters the OTP →** frontend hits `POST /api/otp/verify` with `{ phone, otp, purpose: 'signup' }`.
3. On success the server returns `{ success: true, isExistingUser: false }`.
4. **Frontend now creates the real Supabase user**
   * Generates a temporary password and email alias `<E164>@phone.dharmasaathi.com`.
   * Calls `supabase.auth.signUp()` – this yields a proper `user.id`.
5. A profile stub is inserted / upserted into `users` (mobile_verified = true, is_onboarded = false).
6. User is redirected to `/auth-loading?userId=<uuid>&isNew=true` → on-boarding wizard.

### 2.3  Validation & Error Handling
* Phone is validated against E.164; duplicate numbers trigger a friendly error.
* Incorrect / expired OTP → 400 with `Invalid or expired OTP` – surfaced inline.

---

## 3  Login Flow

### 3.1  Email / Password
* Same as before (`supabase.auth.signInWithPassword`).
* Success → `/auth-loading?userId=<uuid>&isNew=false`.

### 3.2  Phone / WhatsApp-OTP (Web)

1. `POST /api/otp/send` with `{ phone, purpose: 'login' }`.
2. `POST /api/otp/verify` with the OTP.
   * The **verify route** now performs three steps:
     1. Marks the OTP row as `verified_at`.
     2. Generates a one-time password (`otp_<uuid>`) and sets it on the auth user via `supabase.auth.admin.updateUserById`.
     3. Immediately signs in **server-side** with that password to obtain an access / refresh token pair.
   * Those tokens are returned to the client: `{ session: { access_token, refresh_token }, userId, isOnboarded }`.
3. **Client** calls `supabase.auth.setSession()` with the tokens.
4. Dialog closes and navigates to `/auth-loading?userId=<uuid>&mobileLogin=true`.

### 3.3  Mobile-Login Fallback (Cookieless WebView)

* If `setSession` fails (or the browser rejects cookies) the client sets
  ```txt
  localStorage.isMobileLogin = 'true'
  localStorage.mobileLoginUserId = '<uuid>'
  ```
* `AuthLoadingScreen` posts to `POST /api/auth/mobile-session` with `{ userId }`.
  * The route verifies `mobile_verified`, inserts a short-lived `mobile_session` token in `otp_verifications` (purpose = `mobile_session`) and returns minimal user data.
* The fallback then redirects the user based on `isOnboarded` without relying on Supabase cookies.
* `hooks/use-auth.ts` recognises this state and fetches the profile via `/api/users/profile?userId=` until the user performs a full login later.

### 3.4  Password Reset
Same as before – email link → `/reset-password`.

---

## 4  On-Boarding Wizard

### 4.1  Stage List
1. **Seed Stage** – phone verification & basic demography.
2. **Stem Stage** – personal details.
3. **Leaves Stage** – profession & education.
4. **Petals Stage** – spiritual preferences.
5. **Full Bloom** – about-me & photo upload.

Component hierarchy: `onboarding-container.tsx` orchestrates all stages and owns the form state. See `components/onboarding/stages/*` for each page.

### 4.2  Data Flow
* On every step partial data is merged into a local draft state.
* Final **Submit** runs a single `supabase.from('users').upsert()` with the full dataset (+ `is_onboarded=true`).
* Duplicate-phone constraint is handled – if a conflict on phone occurs the upsert is retried without the phone column (this only happens for very old imported data).

### 4.3  Referral Codes
* `signup-section.tsx` stores `referral_code` in `localStorage.signupData`.
* After successful onboarding the wizard calls `POST /api/referrals/signup`.

---

## 5  WhatsApp Automation

### 5.1  Table `whatsapp_outbox`
```
id           bigserial primary key
user_id      uuid
phone        text
template_name text
payload      jsonb
send_after   timestamptz
sent_at      timestamptz
error        text
```

### 5.2  Edge Function `send-whatsapp`
* Runs every minute (Supabase Schedules `* * * * *`).
* Picks rows where `sent_at IS NULL AND send_after <= now()`.
* Calls WATI `/api/v2/sendTemplateMessage`.
* Updates `sent_at` or `error`.
* First row is inserted immediately after **signup OTP verification** to send the "onboarding" welcome message 30 minutes later.

---

## 6  File Reference
* **Frontend**
  * `components/auth-dialog.tsx` – all signup / login UIs.
  * `components/auth-loading-screen.tsx` – post-auth splash, handles mobile-login.
  * `hooks/use-auth.ts` – single source of truth for user & profile state.
  * `components/onboarding/**/*` – wizard.
* **API Routes**
  * `/api/otp/send` – generate & send OTP (WhatsApp).
  * `/api/otp/verify` – verify OTP, create Supabase session or return fallback info.
  * `/api/auth/mobile-session` – create one-time mobile session token for cookieless flows.
  * `/api/users/profile` – service-role profile fetch (mobile-login).
* **Edge Functions**
  * `supabase/functions/send-whatsapp` – WhatsApp outbox cron.

---

## 7  Gotchas & Edge cases
* Browsers that block 3rd-party cookies inside WebViews will fall back to the mobile-login path – always test both!
* Duplicate phone numbers (legacy imports) – upsert will retry without the phone field.
* WATI rejects numbers with `+` – they must be sent as `91xxxxxxxxxx`.

---

**Last updated:** 13 Jul 2025 – after WhatsApp OTP session overhaul. 
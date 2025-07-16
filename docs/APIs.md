# HTTP API Reference

Every endpoint lives under the Next.js
`/api` app-router directory and therefore resolves to
`{BASE_URL}/api/*` in production.  All routes return JSON
and **MUST** be called with `Content-Type: application/json`
unless otherwise noted.

Authentication
--------------

• Where an endpoint requires authentication it expects the [`supabase-js`](https://supabase.com/docs/reference/javascript/auth-signinwithpassword) session JWT to be supplied in the `Authorization` header:

```http
Authorization: Bearer <jwt>
```

Unauthenticated requests will receive `401`.


Endpoints
---------

| Path | Method(s) | Auth | Description |
|------|-----------|------|-------------|
| `/api/otp/send` | POST | ❌ | Send a WhatsApp OTP. Used during sign-up / login. |
| `/api/otp/verify` | POST | ❌ | Verify previously issued OTP and (optionally) create a Supabase session. |
| `/api/otp/test` | GET | ❌ | Test helper that returns a static OTP in non-production environments. |
| `/api/auth/create-session` | POST | ❌ | Internal helper to create a temporary password-based session. |
| `/api/analytics` | GET / POST | ❌ | Store or read anonymous analytics events. |
| `/api/contact` | POST | ❌ | Public “Contact us” form. Persists the message and notifies admins. |
| `/api/blog/posts` | GET | ❌ | Paginated list of published blog posts. Supports `page`, `limit`, `category`, `search`, `featured` query params. |
| `/api/blog/posts/[slug]` | GET | ❌ | Get a single blog post by slug. |
| `/api/blog/categories` | GET | ❌ | Return all blog categories. |
| `/api/blog/analytics` | POST | ❌ | Track blog-level analytics events (views / likes). |
| `/api/blog/newsletter` | POST | ❌ | Add an e-mail address to the marketing newsletter list. |
| `/api/profiles/discover` | GET | ✅ | AI-powered discovery feed. Query params: `mobileUserId` (optional).
| `/api/profiles/matches` | GET | ✅ | Mutual matches for the current user. |
| `/api/profiles/who-liked-me` | GET | ✅ | Profiles that liked the current user but are not yet matched. |
| `/api/users/profile` | GET | ✅ / ❌ | Public user profile. Requires `userId` query param. |
| `/api/swipe` | POST | ✅ | Register a swipe action (`right`, `left`, etc.). |
| `/api/swipe/stats` | GET | ✅ | Aggregated swipe statistics for current user. |
| `/api/swipe/instant-match` | POST | ✅ | Premium “instant match” feature. Charges credits. |
| `/api/messages/conversations` | GET | ✅ | Paginated list of the user’s conversations. |
| `/api/messages/block` | POST | ✅ | Block a user. |
| `/api/messages/highlight` | POST | ✅ | Highlight a message thread (paid). |
| `/api/messages/report` | POST | ✅ | Report a conversation for moderator review. |
| `/api/payments/[action]` | POST | ✅ | One-off Razorpay actions. `action=order` to create order, `action=verify` to verify payment. |
| `/api/payments/process` | POST | ✅ | Internal endpoint that finalises a verified payment and updates user balances. |
| `/api/payments/webhook` | POST | ❌ | Razorpay webhook receiver (validates signature). |
| `/api/referrals/signup` | POST | ✅ | Record a referral signup using code. |
| `/api/admin/dashboard` | GET | 🔒 | Summary metrics for the admin dashboard. |
| `/api/admin/contact-messages` | GET / PATCH | 🔒 | View & resolve public contact form submissions. |
| `/api/admin/notify-user` | POST | 🔒 | Push a one-off notification to a user (e-mail + in-app). |

Legend:
• ✅ – Requires authenticated `Bearer` token
• 🔒 – Requires admin JWT with `role=admin`


Example – Send OTP
------------------
```bash
curl -X POST https://dharma-saathi.app/api/otp/send \
     -H 'Content-Type: application/json' \
     -d '{
           "phone": "+919876543210",
           "purpose": "login"
         }'
```

Successful Response (`200`):
```json
{
  "success": true,
  "message": "OTP sent successfully via WhatsApp"
}
```

Example – Discover Profiles
---------------------------
```bash
curl -X GET https://dharma-saathi.app/api/profiles/discover \
     -H 'Authorization: Bearer <jwt>'
```

Response (trimmed):
```json
{
  "profiles": [
    {
      "id": "user_123",
      "first_name": "Radha",
      "compatibility": {
        "total": 92,
        "breakdown": { "spiritual": 88, "lifestyle": 90, ... }
      },
      "match_rank": 1
    }
  ],
  "total_analyzed": 43,
  "matching_insights": {
    "avg_compatibility": 76,
    "top_score": 92
  }
}
```

> All other endpoints follow a similar request / response pattern.  Refer to the source for edge-cases and full typings.
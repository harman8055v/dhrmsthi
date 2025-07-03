# DharmaSaathi design

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/dharma-saathi/v0-dharma-saathi-onboarding)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/54iXZSVxsxN)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/dharma-saathi/v0-dharma-saathi-onboarding](https://vercel.com/dharma-saathi/v0-dharma-saathi-onboarding)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/54iXZSVxsxN](https://v0.dev/chat/projects/54iXZSVxsxN)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

# DharmaSaathi Web

**Spiritual Matchmaking for Modern India**

DharmaSaathi is India’s first spiritual matrimony and conscious dating platform—connecting yogis, meditators, seekers, and spiritual explorers for meaningful, dharma-based relationships and marriage. This is not your typical matrimony or dating clone—it’s built for deep compatibility, trust, and authentic connections.

---

## 🌟 Live Preview

[www.dharmasaathi.com](https://www.dharmasaathi.com)  
*(Replace with your actual deployment URL)*

---

## 🚀 Key Features

- **Modern, Swipe-based Discovery**  
  - Tinder/Aisle style swipe cards (like, pass, superlike, undo, filters)
  - Real-time matching and notifications

- **Deep, Multi-step Onboarding**  
  - Collects personal, professional, spiritual, and lifestyle details  
  - Photo gallery (min 1, up to 6), KYC/ID upload, completeness meter

- **Advanced Profile Management**  
  - Full profile edit, privacy controls, photo crop/reorder, verified badge

- **Matching & Messaging**  
  - Mutual likes create matches  
  - Real-time chat (Supabase Realtime), typing indicators, read receipts (premium)

- **Who Liked Me & Who Viewed Me**  
  - See who has liked or viewed your profile  
  - Free users see blurred previews; premium users get full access

- **Premium Membership & Payments**  
  - Unlock unlimited swipes, more superlikes, profile boosts, incognito mode, and more
  - Razorpay-powered checkout, instant upgrade/downgrade

- **Admin & Moderation**  
  - Report/block users, admin dashboard, KYC verification, analytics

- **Safety, Trust, and Privacy First**  
  - Email/OTP verification available for added security
  - KYC/ID badge, privacy settings, incognito browsing (premium)

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (React, SSR), TypeScript, TailwindCSS
- **Backend/DB:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Payments:** Razorpay (INR, UPI, cards, wallets)
- **CI/CD & Hosting:** GitHub, Vercel
- **Other:** PWA-ready, fully responsive, SEO optimized

---

## 📁 Repository Structure

/pages — Next.js route pages (home, discovery, matches, profile, etc.)
/components — React components (swipe card, onboarding, chat, filters, etc.)
/lib — Supabase client, utilities, API helpers
/styles — Tailwind and global CSS
/public — Images, icons, logo
/hooks — React custom hooks
PRD.md — Product Requirements Document (full MVP spec)
AGENTS.md — Agent/dev guide for Codex and contributors
db_schema.md — Database schema (Supabase/PostgreSQL)
.env.local — Environment variables for development


---

## 📝 Setup & Installation

**1. Clone this repository**

git clone https://github.com/YOUR-USERNAME/dharmasaathi_web.git
cd dharmasaathi_web

**2. Install dependencies

npm install

**3. Set up environment variables

Create a `.env.local` file and fill in your actual keys:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
# Razorpay credentials for payments
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key-id
# Enable extra logging locally
NEXT_PUBLIC_DEBUG=false
# (Do NOT expose secret keys on frontend!)
\`\`\`

Ensure in your Supabase project settings that email confirmation is disabled so
new users can sign in immediately.
### Referral System Setup
Run the SQL script `scripts/create-referrals-table-simple.sql` in your Supabase project to create the referral tables and setup the referral system. The script safely creates all necessary tables and columns.


**4. Run the app locally

npm run dev

**5. Deploy
Push to GitHub → Vercel will auto-deploy if connected.

📚 Documentation
PRD.md — Full product requirements (features, flows, logic)

AGENTS.md — Developer/AI agent guide (structure, style, workflow)

db_schema.md — Database schema

💡 Contributing
Pull requests, ideas, and suggestions are welcome!
Please read PRD.md and AGENTS.md for contribution guidelines.

### Authentication Flow
Users can create an account from the landing page. The signup form stores the
provided phone number along with first and last name in Supabase and then
redirects to the onboarding flow.

🙏 Credits & License
Created by Harman Batish
MIT License.
Built with ❤️ for India’s spiritual seekers.

### Image Credits
Hero illustrations sourced from [Unsplash](https://unsplash.com) under the Unsplash License.

📬 Contact
For feedback, support, or partnership:
harman@dharmasaathi.com
Instagram: @dharmasaathi

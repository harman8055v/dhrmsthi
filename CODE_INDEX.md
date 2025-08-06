# DharmaSaathi - Complete Code Index

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Core Components](#core-components)
- [API Routes](#api-routes)
- [Hooks & Utilities](#hooks--utilities)
- [Database & Services](#database--services)
- [Authentication & Authorization](#authentication--authorization)
- [Key Features](#key-features)
- [Type Definitions](#type-definitions)
- [Configuration Files](#configuration-files)

---

## 🏗️ Project Overview

**DharmaSaathi** is a Next.js 14 spiritual matrimony platform built with:
- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL), Next.js API Routes
- **Payments**: Razorpay Integration
- **Real-time**: Supabase Realtime for messaging
- **Deployment**: Vercel

---

## 🏛️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │◄──►│   Supabase      │◄──►│   Third Party   │
│   (Frontend)    │    │   (Backend)     │    │   Services      │
│                 │    │                 │    │                 │
│ • Pages/Routes  │    │ • PostgreSQL    │    │ • Razorpay      │
│ • Components    │    │ • Auth          │    │ • WATI OTP      │
│ • Hooks         │    │ • Storage       │    │ • Analytics     │
│ • State Mgmt    │    │ • Real-time     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📁 Directory Structure

### `/app` - Next.js App Router
```
app/
├── (auth)/              # Auth route group
├── (tabs)/              # Tab-based routes
├── admin/               # Admin dashboard
├── api/                 # API route handlers
├── blog/                # Blog functionality
├── dashboard/           # Main user dashboard
├── onboarding/          # User onboarding flow
├── globals.css          # Global styles
├── layout.tsx           # Root layout
└── page.tsx             # Landing page
```

### `/components` - React Components
```
components/
├── ui/                  # Reusable UI components (Shadcn/ui)
├── auth/                # Authentication components
├── dashboard/           # Dashboard-specific components
├── onboarding/          # Onboarding flow components
├── payment/             # Payment & subscription components
└── admin/               # Admin dashboard components
```

### `/lib` - Core Logic & Utilities
```
lib/
├── constants/           # Static data & constants
├── data/                # Data definitions
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
├── analytics.ts         # Analytics service
├── data-service.ts      # Main data service layer
├── logger.ts            # Logging utilities
├── matching-engine.ts   # AI matching algorithm
├── supabase.ts          # Supabase client
└── utils.ts             # Utility functions
```

---

## 🧩 Core Components

### Navigation & Layout
| Component | Path | Purpose |
|-----------|------|---------|
| `MobileNav` | `components/dashboard/mobile-nav.tsx` | Bottom navigation bar |
| `NativeHeader` | `components/native-header.tsx` | Top header with back navigation |
| `AuthProvider` | `components/auth-provider.tsx` | Authentication context |
| `ReactQueryProvider` | `components/react-query-provider.tsx` | React Query setup |

### Dashboard Components
| Component | Path | Purpose |
|-----------|------|---------|
| `SwipeStack` | `components/dashboard/swipe-stack.tsx` | Main swipe interface |
| `WelcomeSection` | `components/dashboard/welcome-section.tsx` | User welcome display |
| `NewUserWelcome` | `components/dashboard/new-user-welcome.tsx` | First-time user UI |
| `SettingsCard` | `components/dashboard/settings-card.tsx` | Settings navigation cards |
| `ProfileImageUploader` | `components/dashboard/profile-image-uploader.tsx` | Photo upload interface |

### Authentication & Onboarding
| Component | Path | Purpose |
|-----------|------|---------|
| `SignupSection` | `components/signup-section.tsx` | Landing page signup |
| `AuthDialog` | `components/auth-dialog.tsx` | Login/signup modal |
| `OnboardingContainer` | `components/onboarding/onboarding-container.tsx` | Main onboarding flow |
| `SeedStage` | `components/onboarding/stages/seed-stage.tsx` | Phone verification |
| `AuthLoadingScreen` | `components/auth-loading-screen.tsx` | Post-auth loading |

---

## 🛣️ API Routes

### User Management
| Route | File | Purpose |
|-------|------|---------|
| `/api/users/profile` | `app/api/users/profile/route.ts` | User profile CRUD |
| `/api/profiles/discover` | `app/api/profiles/discover/route.ts` | Profile discovery engine |
| `/api/profiles/matches` | `app/api/profiles/matches/route.ts` | Match management |
| `/api/profiles/who-liked-me` | `app/api/profiles/who-liked-me/route.ts` | Who liked you feature |

### Swipe System
| Route | File | Purpose |
|-------|------|---------|
| `/api/swipe` | `app/api/swipe/route.ts` | Swipe actions (like/pass) |
| `/api/swipe/stats` | `app/api/swipe/stats/route.ts` | Daily swipe statistics |
| `/api/swipe/instant-match` | `app/api/swipe/instant-match/route.ts` | Instant match feature |

### Messaging
| Route | File | Purpose |
|-------|------|---------|
| `/api/messages` | `app/api/messages/route.ts` | Message CRUD operations |
| `/api/messages/conversations` | `app/api/messages/conversations/route.ts` | Conversation management |
| `/api/messages/send` | `app/api/messages/send/route.ts` | Send message endpoint |

### Payments & Subscriptions
| Route | File | Purpose |
|-------|------|---------|
| `/api/payments/create-order` | `app/api/payments/create-order/route.ts` | Razorpay order creation |
| `/api/payments/verify` | `app/api/payments/verify/route.ts` | Payment verification |
| `/api/subscriptions/create` | `app/api/subscriptions/create/route.ts` | Subscription management |

### Admin
| Route | File | Purpose |
|-------|------|---------|
| `/api/admin/dashboard` | `app/api/admin/dashboard/route.ts` | Admin dashboard data |
| `/api/admin/contact-messages` | `app/api/admin/contact-messages/route.ts` | Support messages |
| `/api/admin/notify-user` | `app/api/admin/notify-user/route.ts` | User notifications |

### Authentication
| Route | File | Purpose |
|-------|------|---------|
| `/api/otp/send` | `app/api/otp/send/route.ts` | OTP sending via WATI |
| `/api/otp/verify` | `app/api/otp/verify/route.ts` | OTP verification |
| `/api/auth/mobile-login` | `app/api/auth/mobile-login/route.ts` | Mobile app authentication |

---

## ⚡ Hooks & Utilities

### Custom Hooks
| Hook | File | Purpose |
|------|------|---------|
| `useAuth` | `hooks/use-auth.ts` | Authentication state |
| `useProfile` | `hooks/use-profile.ts` | User profile management |
| `useSwipe` | `hooks/use-swipe.ts` | Swipe functionality |
| `useMessages` | `hooks/use-messages.ts` | Message management |
| `useUnreadCount` | `hooks/use-unread-count.ts` | Unread message count |
| `useAnalytics` | `hooks/use-analytics.ts` | Analytics tracking |
| `useToast` | `hooks/use-toast.ts` | Toast notifications |

### Location Hooks
| Hook | File | Purpose |
|------|------|---------|
| `useStates` | `lib/hooks/useLocations.ts` | Indian states data |
| `useCities` | `lib/hooks/useLocations.ts` | Cities by state |
| `useCountries` | `lib/hooks/useLocationData.ts` | Countries data |

### Utility Functions
| Function | File | Purpose |
|----------|------|---------|
| `cn` | `lib/utils.ts` | CSS class concatenation |
| `isUserVerified` | `lib/utils.ts` | Check verification status |
| `getAvatarInitials` | `lib/utils.ts` | Generate avatar initials |
| `formatPhoneE164` | `lib/utils.ts` | Phone number formatting |

---

## 🗄️ Database & Services

### Data Service Layer
| Service | File | Purpose |
|---------|------|---------|
| `userService` | `lib/data-service.ts` | User data operations |
| `fileService` | `lib/data-service.ts` | File upload/management |
| `swipeService` | `lib/data-service.ts` | Swipe data operations |
| `matchService` | `lib/data-service.ts` | Match management |
| `messageService` | `lib/data-service.ts` | Message operations |
| `premiumService` | `lib/data-service.ts` | Premium features |
| `analyticsService` | `lib/data-service.ts` | Analytics tracking |

### Matching Engine
| Component | File | Purpose |
|-----------|------|---------|
| `AdvancedMatchingEngine` | `lib/matching-engine.ts` | AI-powered profile matching |
| `matchingEngine` | `lib/matching-engine.ts` | Singleton instance |

### Database Clients
| Client | File | Purpose |
|--------|------|---------|
| `supabase` | `lib/supabase.ts` | Main Supabase client |
| `supabaseClient` | `lib/supabaseClient.ts` | Alternative client config |

---

## 🔐 Authentication & Authorization

### Auth Flow Components
| Component | Purpose |
|-----------|---------|
| `AuthProvider` | Global auth context |
| `AuthDialog` | Login/signup modal |
| `AuthLoadingScreen` | Post-login loading |
| `SeedStage` | Phone verification |

### Auth Utilities
| Function | Purpose |
|----------|---------|
| `isUserVerified` | Check verification status |
| `canAccessVerifiedFeatures` | Premium feature access |
| `getVerificationStatusText` | Status display text |

### Protected Routes
- Dashboard pages require authentication
- Premium features require subscription
- Admin routes require admin role

---

## ⭐ Key Features

### 1. Swipe System
- **Files**: `components/dashboard/swipe-stack.tsx`, `app/api/swipe/route.ts`
- **Features**: Like/Pass, Super Like, Undo, Daily limits
- **Documentation**: `SWIPE_SYSTEM_DOCUMENTATION.md`

### 2. Matching Engine
- **File**: `lib/matching-engine.ts`
- **Features**: AI-powered compatibility scoring
- **Documentation**: `ADVANCED_MATCHING_SYSTEM.md`

### 3. Who Liked You
- **Files**: `components/dashboard/who-liked-you.tsx`, `app/api/profiles/who-liked-me/route.ts`
- **Features**: Premium feature for viewing likes
- **Documentation**: `WHO_LIKED_YOU_FEATURE_GUIDE.md`

### 4. Referral System
- **Files**: `components/dashboard/referral-program.tsx`, `app/api/referrals/route.ts`
- **Features**: Referral tracking and rewards
- **Documentation**: `REFERRAL_SYSTEM_PRODUCTION_GUIDE.md`

### 5. Profile Scoring
- **Implementation**: `lib/matching-engine.ts`
- **Documentation**: `PROFILE_SCORING_SYSTEM.md`

### 6. Payment Integration
- **Provider**: Razorpay
- **Files**: `app/api/payments/`, `components/payment/`
- **Documentation**: `RAZORPAY_SUBSCRIPTION_SETUP.md`

---

## 📝 Type Definitions

### Core Types
| File | Purpose |
|------|---------|
| `lib/types/onboarding.ts` | Onboarding flow types |
| `lib/types/profiles.ts` | User profile types |
| `lib/types/matching.ts` | Matching system types |
| `lib/types/payments.ts` | Payment types |

### Constants
| File | Purpose |
|------|---------|
| `lib/constants/mother-tongues.ts` | Language options |
| `lib/constants/spiritual-orgs.ts` | Spiritual organizations |
| `lib/constants/daily-practices.ts` | Spiritual practices |

---

## ⚙️ Configuration Files

### Build & Dev
| File | Purpose |
|------|---------|
| `next.config.mjs` | Next.js configuration |
| `tailwind.config.ts` | TailwindCSS config |
| `tsconfig.json` | TypeScript config |
| `postcss.config.mjs` | PostCSS config |

### Testing
| File | Purpose |
|------|---------|
| `jest.config.js` | Jest test configuration |
| `jest.setup.js` | Test environment setup |

### Dependencies
| File | Purpose |
|------|---------|
| `package.json` | NPM dependencies |
| `pnpm-lock.yaml` | Lock file for pnpm |

---

## 📚 Documentation Files

### Core Documentation
- `README.md` - Project overview and setup
- `SCHEMA.MD` - Database schema
- `REFACTORING_SUMMARY.md` - Recent changes
- `PRODUCTION_CHECKLIST.md` - Deployment guide

### Feature Documentation
- `ONBOARDING_AND_AUTH_FLOW.md` - Authentication flow
- `SWIPE_SYSTEM_DOCUMENTATION.md` - Swipe mechanics
- `ADVANCED_MATCHING_SYSTEM.md` - Matching algorithm
- `WHO_LIKED_YOU_FEATURE_GUIDE.md` - Premium feature
- `PROFILE_SCORING_SYSTEM.md` - Scoring algorithm
- `REFERRAL_SYSTEM_PRODUCTION_GUIDE.md` - Referral system

### Technical Guides
- `RAZORPAY_SUBSCRIPTION_SETUP.md` - Payment setup
- `WATI_OTP_MIGRATION_GUIDE.md` - OTP integration
- `TROUBLESHOOTING_PAYMENTS.md` - Payment issues
- `PASSWORD_RESET_DOCUMENTATION.md` - Password reset
- `ADMIN_SETUP_GUIDE.md` - Admin configuration

---

## 🚀 Deployment & Production

### Environment Setup
- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Production**: Vercel deployment

### Key Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `WATI_API_TOKEN`

---

## 🧪 Testing

### Test Structure
```
__tests__/
├── api/                 # API route tests
├── components/          # Component tests
├── hooks/               # Hook tests
├── integration/         # Integration tests
├── lib/                 # Library tests
└── utils/               # Utility tests
```

### Test Commands
- `npm test` - Run all tests
- `npm run test:watch` - Watch mode
- `npm run test:coverage` - Coverage report

---

## 📊 Analytics & Monitoring

### Analytics Implementation
- **Service**: `lib/analytics.ts`
- **Hook**: `hooks/use-analytics.ts`
- **Events**: User interactions, feature usage
- **API**: `app/api/analytics/route.ts`

### Logging
- **Service**: `lib/logger.ts`
- **Levels**: Debug, Info, Warn, Error
- **Environment**: Configurable logging

---

## 🔄 State Management

### React Query
- **Provider**: `components/react-query-provider.tsx`
- **Queries**: Data fetching and caching
- **Mutations**: Data updates

### Context Providers
- **Auth**: `components/auth-provider.tsx`
- **Theme**: `components/theme-provider.tsx`

---

## 📱 Mobile Optimization

### Responsive Design
- Mobile-first approach
- Touch-friendly interfaces
- Native-like navigation

### PWA Features
- Service worker ready
- Installable app
- Offline capabilities

---

*This index was last updated on: August 5, 2025*
*Generated by: GitHub Copilot*

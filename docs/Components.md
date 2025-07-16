# React Component Catalogue

All components live within the `/components` tree and are **fully typed** with TypeScript.  They follow the [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/) methodology (atoms / molecules / organisms) for maximum re-use.

The tables below only list *public* components – i.e. the modules you are encouraged to import in app‐level code.  Internal helpers (prefixed with `_`) are intentionally omitted.


## UI Atoms & Molecules

| Name | File | Description | Basic Usage |
|------|------|-------------|-------------|
| `PhoneInput` | `components/ui/phone-input.tsx` | International phone field with automatic E.164 formatting and basic validation. | `import PhoneInput from "@/components/ui/phone-input";`<br>`<PhoneInput value={phone} onChange={setPhone} />` |
| `FullScreenLoading` | `components/full-screen-loading.tsx` | Blocking spinner overlay used during auth and long network tasks. | `<FullScreenLoading title="Signing In" />` |
| `ToastManager` | `components/toast-manager.tsx` | Global toast notification portal backed by [@tanstack/react-query](https://tanstack.com/query/latest). | `<ToastManager />` (placed once near `<body>`) |


## Authentication

| Component | File | Props |
|-----------|------|-------|
| `AuthDialog` | `components/auth-dialog.tsx` | `isOpen`, `onClose`, `defaultMode` (`"login" \| "signup"`)|
| `AuthLoadingScreen` | `components/auth-loading-screen.tsx` | `userId`, `isNewUser`, `isMobileLogin` |
| `AuthProvider` | `components/auth-provider.tsx` | Wraps Supabase session handling and context. |

Usage example – modal login:
```tsx
import { useState } from "react";
import AuthDialog from "@/components/auth-dialog";

export default function LoginButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Login</button>
      <AuthDialog isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
```


## Onboarding Flow

| Component | Purpose |
|-----------|---------|
| `OnboardingContainer` | Top-level state manager that orchestrates the multi-stage onboarding wizard. |
| `NavigationButtons` | Back / Next buttons with built-in validation states. |
| `ProgressBar` | Thin progress indicator shown at top of each stage. |
| `LotusAnimation` | Subtle background animation reflecting the current stage. |
| `StageIndicator` | Dot-based breadcrumb below the header. |
| Stage components (`SeedStage`, `StemStage`, `LeavesStage`, `PetalsStage`, `FullBloomStage`) | Individual screens for gathering profile data. |

Each stage receives `formData`, `onChange`, `onNext`, `isLoading`, and `error` props to keep UX consistent.  See `components/onboarding/*` for implementation details.


## Landing Page / Marketing

| Component | File |
|-----------|------|
| `Hero` | `components/hero.tsx` |
| `Features` | `components/features.tsx` |
| `HowItWorks` | `components/how-it-works.tsx` |
| `Faq` | `components/faq.tsx` |
| `SignupSection` | `components/signup-section.tsx` |
| `Footer` | `components/footer.tsx` |
| `Header` | `components/header.tsx` |

All marketing components are *server-rendered* and **do not** ship client-side JavaScript unless interactive props are passed, keeping the landing page lightweight.


## Dashboard / Authenticated App

| Component | Purpose |
|-----------|---------|
| `SwipeStack` | Tinder-style card stack built on top of [`react-tinder-card`](https://www.npmjs.com/package/react-tinder-card). |
| `SwipeCard` | Single profile card with gesture handlers. |
| `MobileNav` | Bottom navigation for small screens. |
| `NewUserWelcome` | First-time user walkthrough overlay. |
| `ProfileImageUploader` | Multi-file uploader with cropping & Supabase storage integration. |
| `SettingsCard` | Container for account settings and premium upsells. |
| `WhoLikedYou` | Grid of profiles that have liked the current user. |


### Example – Swipe integration
```tsx
import SwipeStack from "@/components/dashboard/swipe-stack";

export default function Home({ profiles }) {
  return (
    <SwipeStack
      profiles={profiles}
      onSwipe={(profile, direction) => {/* … */}}
    />
  );
}
```

> All components accept `className` and spread extra props to their root element, making theme-ing straightforward with Tailwind.
import type { User } from "@supabase/supabase-js"
import type { OnboardingProfile } from "@/lib/types/onboarding"

/**
 * Centralized routing logic for authentication and onboarding flows
 */

export const ROUTES = {
  HOME: "/",
  AUTH_LOADING: "/auth-loading",
  ONBOARDING: "/onboarding",
  ONBOARDING_WELCOME: "/onboarding/welcome",
  DASHBOARD: "/dashboard",
  PASSWORD_RECOVERY: "/password-recovery",
} as const

/**
 * Determines the next route based on user and profile state
 */
export function getNextRoute(
  user: User | null,
  profile: OnboardingProfile | null,
  forceOnboarding = false
): string {
  // No user - go to home
  if (!user) {
    return ROUTES.HOME
  }

  // User exists but no profile - start onboarding
  if (!profile) {
    return ROUTES.ONBOARDING
  }

  // Force onboarding flag (used for new signups)
  if (forceOnboarding) {
    return ROUTES.ONBOARDING
  }

  // Profile exists but not onboarded - continue onboarding
  if (!profile.is_onboarded) {
    return ROUTES.ONBOARDING
  }

  // Fully onboarded - go to dashboard
  return ROUTES.DASHBOARD
}

/**
 * Builds auth loading URL with query parameters
 */
export function buildAuthLoadingUrl(params: {
  userId?: string
  isNew?: boolean
  mobileLogin?: boolean
}): string {
  const url = new URL(ROUTES.AUTH_LOADING, window.location.origin)
  
  if (params.userId) {
    url.searchParams.set("userId", params.userId)
  }
  
  if (params.isNew !== undefined) {
    url.searchParams.set("isNew", params.isNew.toString())
  }
  
  if (params.mobileLogin !== undefined) {
    url.searchParams.set("mobileLogin", params.mobileLogin.toString())
  }
  
  return url.pathname + url.search
}

/**
 * Cleans up auth-related data from localStorage
 */
export function cleanupAuthStorage(): void {
  if (typeof window === "undefined") return
  
  try {
    // Remove temporary auth data
    localStorage.removeItem("mobileLoginUserId")
    localStorage.removeItem("isMobileLogin")
    
    // Clear signup data after successful onboarding
    const signupData = localStorage.getItem("signupData")
    if (signupData) {
      try {
        const data = JSON.parse(signupData)
        // Keep referral code if present, clear everything else
        if (data.referral_code) {
          localStorage.setItem("signupData", JSON.stringify({ referral_code: data.referral_code }))
        } else {
          localStorage.removeItem("signupData")
        }
      } catch {
        localStorage.removeItem("signupData")
      }
    }
  } catch (error) {
    console.error("Error cleaning up auth storage:", error)
  }
}

/**
 * Extracts and validates mobile login data from localStorage
 */
export function getMobileLoginData(): { userId: string | null; isMobileLogin: boolean } {
  if (typeof window === "undefined") {
    return { userId: null, isMobileLogin: false }
  }
  
  try {
    const isMobileLogin = localStorage.getItem("isMobileLogin") === "true"
    const userId = localStorage.getItem("mobileLoginUserId")
    
    return {
      userId: userId && isMobileLogin ? userId : null,
      isMobileLogin
    }
  } catch {
    return { userId: null, isMobileLogin: false }
  }
}

/**
 * Safely redirects with error handling
 */
export function safeRedirect(router: any, url: string, replace = true): void {
  try {
    if (replace) {
      router.replace(url)
    } else {
      router.push(url)
    }
  } catch (error) {
    console.error("Redirect error:", error)
    // Fallback to window.location if router fails
    window.location.href = url
  }
}

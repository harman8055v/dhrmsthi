import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to check if user is verified
export function isUserVerified(profile: any): boolean {
  if (!profile) return false
  
  // User is verified if:
  // 1. verification_status is "verified"
  // 2. account_status is premium/elite (premium users are auto-verified)
  return (
    profile.verification_status === "verified" ||
    ["premium", "elite"].includes(profile?.account_status ?? "")
  )
}

// Utility function to check if user can access verified features
export function canAccessVerifiedFeatures(profile: any): boolean {
  return isUserVerified(profile)
}

// Utility function to get user verification status display text
export function getVerificationStatusText(profile: any): string {
  if (!profile) return "Unknown"
  
  if (isUserVerified(profile)) {
    return "Verified"
  }
  
  if (profile.verification_status === "rejected") {
    return "Verification Rejected"
  }
  
  if (profile.fast_track_verification) {
    return "Fast Track Verification"
  }
  
  return "Profile Under Review"
}

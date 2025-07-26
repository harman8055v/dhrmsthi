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
  // 2. account_status is sangam/samarpan (premium users are auto-verified)
  return (
    profile.verification_status === "verified" ||
    ["sangam", "samarpan"].includes(profile?.account_status ?? "")
  )
}

// Utility function to generate avatar initials from names
export function getAvatarInitials(firstName?: string | null, lastName?: string | null): string {
  // Ensure we have valid, non-empty string names after trimming
  const cleanFirstName = firstName && typeof firstName === 'string' && firstName.trim() 
    ? firstName.trim() 
    : null
  
  const cleanLastName = lastName && typeof lastName === 'string' && lastName.trim() 
    ? lastName.trim() 
    : null

  // Get first letter of each name, ensuring they are alphabetic characters
  const firstInitial = cleanFirstName && /^[a-zA-Z]/.test(cleanFirstName) 
    ? cleanFirstName[0].toUpperCase() 
    : ''
  
  const lastInitial = cleanLastName && /^[a-zA-Z]/.test(cleanLastName) 
    ? cleanLastName[0].toUpperCase() 
    : ''

  // Return initials or fallback to 'U' if no valid initials found
  const initials = firstInitial + lastInitial
  return initials || 'U'
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

// ───────────────────────────────────────────────────────────────
// Phone Helpers
// ───────────────────────────────────────────────────────────────
/**
 * Format a phone number into E.164 format.
 * - Removes all non-digit characters (except leading "+" if present)
 * - Always prefixes with "+" once cleaned (does NOT guess country codes)
 */
export function formatPhoneE164(input: string): string {
  if (!input) return ""

  // Strip everything except digits
  const digitsOnly = input.replace(/[^\d]/g, "")

  if (!digitsOnly) return ""

  // Always return with a single leading +
  return `+${digitsOnly}`
}
 
 /**
  * Basic E.164 phone validation (international format)
  * Allows + followed by 10-15 digits (country code cannot start with 0).
  */
 export function isValidPhoneE164(phone: string): boolean {
   if (!phone) return false
   const e164 = phone.trim()
   const regex = /^\+[1-9]\d{9,14}$/
   return regex.test(e164)
 }
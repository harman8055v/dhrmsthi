"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { debugLog } from "@/lib/logger"
import OnboardingContainer from "@/components/onboarding/onboarding-container"
import LoadingScreen from "@/components/onboarding/loading-screen"
import type { User } from "@supabase/supabase-js"
import type { OnboardingProfile } from "@/lib/types/onboarding"
import "./onboarding.css"

export default function OnboardingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<OnboardingProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      try {
        // Check if this is a mobile login
        const isMobileLogin = typeof window !== 'undefined' && localStorage.getItem('isMobileLogin') === 'true';
        const mobileLoginUserId = typeof window !== 'undefined' ? localStorage.getItem('mobileLoginUserId') : null;

        // Get the current user session
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        // If we reach here and there's no session yet (OTP not verified), fall back to buffered data
        if (userError || !user) {
          // Check if this is a mobile login
          if (isMobileLogin && mobileLoginUserId) {
            
            // Fetch user profile using the mobile login user ID
            const { data: profileData, error: profileError } = await supabase
              .from("users")
              .select("*")
              .eq("id", mobileLoginUserId)
              .single()

            if (profileError || !profileData) {
              // Clear mobile login data
              localStorage.removeItem('isMobileLogin')
              localStorage.removeItem('mobileLoginUserId')
              router.push('/')
              return
            }

            // Check if already onboarded
            if (profileData.is_onboarded) {
              debugLog("Mobile login user already onboarded, redirecting to dashboard")
              router.push("/dashboard")
              return
            }

            // Set up profile for onboarding
            setUser(null) // No auth user for mobile login
            setProfile(profileData)
            setLoading(false)
            return
          }

          // Original buffered data logic
          let buffered: any = null
          if (typeof window !== 'undefined') {
            try {
              const raw = localStorage.getItem('signupData')
              if (raw) buffered = JSON.parse(raw)
            } catch (_) {}
          }

          if (!buffered) {
            // Nothing buffered, redirect home
            router.push('/')
            return
          }

          const placeholderProfile = {
            id: 'temp',
            phone: buffered.phone || buffered.mobileNumber || '',
            email: buffered.email || '',
            first_name: buffered.first_name || null,
            last_name: buffered.last_name || null,
            full_name: buffered.full_name || null,
            mobile_verified: false,
            email_verified: false,
            is_onboarded: false,
            // Personal & physical
            gender: null,
            birthdate: null,
            height_ft: null,
            height_in: null,
            // Location
            country_id: null,
            state_id: null,
            city_id: null,
            // Professional
            education: null,
            profession: null,
            annual_income: null,
            marital_status: null,
            // Spiritual
            diet: null,
            temple_visit_freq: null,
            vanaprastha_interest: null,
            artha_vs_moksha: null,
            spiritual_org: [],
            daily_practices: [],
            user_photos: [],
            ideal_partner_notes: null,
            about_me: null,
            favorite_spiritual_quote: null,
            // Counters
            super_likes_count: 5,
            swipe_count: 50,
            message_highlights_count: 3,
            profile_score: 5,
          } as unknown as OnboardingProfile

          setUser(null)
          setProfile(placeholderProfile)
          setLoading(false)
          return
        }

        debugLog("Authenticated user found:", user.id)
        setUser(user)

        // Fetch user profile data using user ID
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()

        if (profileError) {
          setError("Error loading profile. Please try again.")
          setTimeout(() => router.push("/"), 3000)
          return
        }

        if (!profileData) {
          // No profile found, create a minimal one with required fields
          debugLog("No profile found, creating new profile")
          const newProfile: Partial<OnboardingProfile> = {
            id: user.id,
            phone: user.phone || '',
            email: user.email || undefined,
            mobile_verified: !!user.phone_confirmed_at,
            email_verified: !!user.email_confirmed_at,
            is_onboarded: false,
            // Initialize all enum fields as null
            gender: null,
            birthdate: null,
            country_id: null,
            state_id: null,
            city_id: null,
            education: null,
            profession: null,
            annual_income: null,
            marital_status: null,
            diet: null,
            temple_visit_freq: null,
            vanaprastha_interest: null,
            artha_vs_moksha: null,
            spiritual_org: [],
            daily_practices: [],
            user_photos: [],
            // preference placeholders can be added later
            ideal_partner_notes: null,
            favorite_spiritual_quote: null,
            // Initialize counters
            super_likes_count: 5,
            swipe_count: 50,
            message_highlights_count: 3,
            
            // Default profile quality score
            profile_score: 5,
          }

          // Do NOT insert here to avoid duplicate-phone conflicts.
          // We'll upsert once at the final onboarding submission.
          setProfile(newProfile as OnboardingProfile)
        } else {
          // Profile found
          debugLog("Profile found:", profileData)

          // If user has completed onboarding, redirect to dashboard
          if ((profileData as any)?.is_onboarded) {
            debugLog("Onboarding already completed, redirecting to dashboard")
            router.push("/dashboard")
            return
          }

          // Ensure verification status is set based on auth status if not already set
          if (profileData.email_verified === null || profileData.email_verified === undefined) {
            profileData.email_verified = !!user.email_confirmed_at
          }

          if (profileData.mobile_verified === null || profileData.mobile_verified === undefined) {
            profileData.mobile_verified = !!user.phone_confirmed_at
          }

          setProfile(profileData)
        }

        setLoading(false)
      } catch (error) {
        setError("An unexpected error occurred. Please try again.")
        setTimeout(() => router.push("/"), 3000)
      }
    }

    getUser()
  }, [router])

  if (loading) {
    return <LoadingScreen />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">Redirecting you back to the homepage...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="text-center p-8">
          <div className="text-orange-500 text-6xl mb-4">🔄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Setting up your profile...</h1>
          <p className="text-gray-600">Please wait while we prepare your onboarding experience.</p>
        </div>
      </div>
    )
  }

  return <OnboardingContainer user={user} profile={profile} setProfile={setProfile} />
}

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
        // Get the current user session
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError) {
          console.error("Auth error:", userError)
          setError("Authentication error. Please try signing in again.")
          setTimeout(() => router.push("/"), 3000)
          return
        }

        if (!user) {
          debugLog("No authenticated user found, redirecting to homepage")
          router.push("/")
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
          console.error("Error fetching user profile:", {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code,
          })
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
            onboarding_completed: false,
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
            preferred_age_min: null,
            preferred_age_max: null,
            preferred_diet: [],
            preferred_spiritual_orgs: [],
            preferred_practices: [],
            ideal_partner_notes: null,
            favorite_spiritual_quote: null,
            // Initialize counters
            super_likes_count: 5,
            swipe_count: 50,
            message_highlights_count: 3,
            
            // Default profile quality score
            profile_score: 5,
          }

          // Try to insert the new profile
          const { data: insertedProfile, error: insertError } = await supabase
            .from("users")
            .insert({
              ...newProfile,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single()

          if (insertError) {
            console.error("Error creating profile:", {
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code,
            })
            
            // Handle specific phone constraint error
            if (insertError.message.includes('phone_key') || 
                insertError.message.includes('users_v2_phone_key') || 
                (insertError.code === '23505' && insertError.message.includes('phone'))) {
              setError(`This phone number is already registered. If this is your number, please contact support or try logging in.`)
              return
            }
            
            // For other errors, use the local profile to continue onboarding
            setProfile(newProfile as OnboardingProfile)
          } else {
            setProfile(insertedProfile)
          }
        } else {
          // Profile found
          debugLog("Profile found:", profileData)

          // If user has completed onboarding, redirect to dashboard
          if (profileData?.onboarding_completed) {
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
        console.error("Error in auth check:", error)
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

  if (!user || !profile) {
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

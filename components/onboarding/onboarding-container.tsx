"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { debugLog } from "@/lib/logger"
import type { User } from "@supabase/supabase-js"
import type { OnboardingData, OnboardingProfile } from "@/lib/types/onboarding"
import { VALID_VALUES, validateEnumField } from "@/lib/types/onboarding"
import ProgressBar from "./progress-bar"
import NavigationButtons from "./navigation-buttons"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import FullScreenLoading from "@/components/full-screen-loading"

// Dynamic imports for stages
import StemStage from "./stages/stem-stage"
import LeavesStage from "./stages/leaves-stage"
import PetalsStage from "./stages/petals-stage"
import FullBloomStage from "./stages/full-bloom-stage"

interface OnboardingContainerProps {
  user: User | null
  profile: OnboardingProfile
  setProfile: (profile: OnboardingProfile) => void
}

// Removes keys with null/undefined or blank-string values
function sanitizePayload<T extends Record<string, any>>(data: T): Partial<T> {
  const cleaned: Partial<T> = {}
  for (const [key, value] of Object.entries(data)) {
    // Include any value that is not null, undefined, or empty string
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key as keyof T] = value
    }
  }
  return cleaned
}

// Default form data
const DEFAULT_FORM_DATA: OnboardingData = {
  phone: '',
  email_verified: false,
  mobile_verified: false,
  gender: null,
  birthdate: null,
  height_ft: null,
  height_in: null,
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
  ideal_partner_notes: null,
  favorite_spiritual_quote: null,
  about_me: null,
}

export default function OnboardingContainer({ user, profile, setProfile }: OnboardingContainerProps) {
  const router = useRouter()
  const [stage, setStage] = useState(1)
  const [formData, setFormData] = useState<OnboardingData>(DEFAULT_FORM_DATA)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCompletion, setShowCompletion] = useState(false)
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null)

  // Early return if user already completed onboarding
  if (profile && (profile.onboarding_completed === true || (profile as any).is_onboarded === true)) {
    console.log("User already completed onboarding, redirecting to dashboard")
    router.push("/dashboard")
    return null
  }

  // ---------------- Debounced autosave ----------------
  useEffect(() => {
    if (!user?.id) return

    // Clear previous timer
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current)
    }

    autosaveTimer.current = setTimeout(async () => {
      try {
        // Only autosave for current stage data
        const payload = sanitizePayload(formData)
        if (Object.keys(payload).length > 0) {
          await submitUserProfile(payload)
        }
      } catch (err) {
        // Silently log – autosave failures shouldn't break UX
        console.warn("[Onboarding] Autosave failed", err)
      }
    }, 1500) // 1.5s debounce

    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData])

  // ------------------------------------------------------------
  // Local-storage helpers for draft recovery
  // ------------------------------------------------------------
  const STORAGE_KEY = user ? `onboarding-${user.id}` : null

  // Attempt to load saved draft once (after first render when user available)
  useEffect(() => {
    if (!STORAGE_KEY) return

    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached) as { formData: OnboardingData; stage: number }
        if (parsed?.formData) setFormData(parsed.formData)
        if (parsed?.stage) setStage(parsed.stage)
      }
    } catch (err) {
      console.warn("[Onboarding] Failed to parse cached form data", err)
    }
    // run only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORAGE_KEY])

  // Persist draft to localStorage whenever formData or stage changes
  useEffect(() => {
    if (!STORAGE_KEY) return
    try {
      const payload = JSON.stringify({ formData, stage })
      localStorage.setItem(STORAGE_KEY, payload)
    } catch (err) {
      // silent – localStorage might be full / unsupported
    }
  }, [formData, stage, STORAGE_KEY])

  // Initialize form data from existing profile
  useEffect(() => {
    if (profile) {
      setFormData({
        ...DEFAULT_FORM_DATA,
        phone: user?.phone || profile.phone || '',
        email_verified: !!user?.email_confirmed_at || profile.email_verified || false,
        mobile_verified: !!user?.phone_confirmed_at || profile.mobile_verified || false,
        gender: profile.gender || null,
        birthdate: profile.birthdate || null,
        height_ft: profile.height_ft || null,
        height_in: profile.height_in || null,
        country_id: profile.country_id || null,
        state_id: profile.state_id || null,
        city_id: profile.city_id || null,
        education: profile.education || null,
        profession: profile.profession || null,
        annual_income: profile.annual_income || null,
        marital_status: profile.marital_status || null,
        diet: profile.diet || null,
        temple_visit_freq: profile.temple_visit_freq || null,
        vanaprastha_interest: profile.vanaprastha_interest || null,
        artha_vs_moksha: profile.artha_vs_moksha || null,
        spiritual_org: profile.spiritual_org || [],
        daily_practices: profile.daily_practices || [],
        user_photos: profile.user_photos || [],
        ideal_partner_notes: profile.ideal_partner_notes || null,
        favorite_spiritual_quote: profile.favorite_spiritual_quote || null,
        about_me: profile.about_me || null,
      })

      // Fallback heuristic based on data completeness
      if (!profile.gender || !profile.birthdate || !profile.height_ft || !profile.height_in) {
        setStage(1)
      } else if (!profile.education || !profile.profession) {
        setStage(2)
      } else if (!profile.diet) {
        setStage(3)
      } else if (!profile.ideal_partner_notes) {
        setStage(4)
      }
    }
  }, [profile, user])

  const handleFormChange = (updates: Partial<OnboardingData>) => {
    setFormData((prev: OnboardingData) => ({ ...prev, ...updates }))
    setError(null) // Clear any previous errors
  }

  // Submit user profile using upsert to avoid duplicate key errors
  async function submitUserProfile(profileData: Partial<OnboardingData>) {
    if (!user?.id) {
      throw new Error("User ID is required for profile submission")
    }

    try {
      console.log("Submitting user profile for user ID:", user.id)
      console.log("Profile data to submit:", profileData)
      console.log("User phone from auth:", user.phone)
      console.log("User email from auth:", user.email)
      
      // Debug: List all keys being submitted
      console.log("Keys being submitted:", Object.keys(profileData))
      
      // Debug: Check for any preferred_ fields
      const preferredFields = Object.keys(profileData).filter(key => key.startsWith('preferred_'))
      if (preferredFields.length > 0) {
        console.warn("Found preferred_ fields in payload:", preferredFields)
        // Remove any preferred_ fields that shouldn't be there
        preferredFields.forEach(field => {
          delete (profileData as any)[field]
        })
      }

      // Combine incoming fields with bookkeeping columns
      const timestamp = new Date().toISOString()
      const payload = {
        id: user.id,
        updated_at: timestamp,
        ...profileData,
      }

      // Perform update scoped to current user ID (RLS compliant)
      let { data, error } = await supabase
        .from("users")
        .update(payload)
        .eq("id", user.id)
        .select()
        .single()
      // Fallback: onboarding_stage column might not exist yet in DB
      if (error && error.message?.includes("onboarding_stage")) {
        const { onboarding_stage, ...withoutStage } = payload as any
        ;({ data, error } = await supabase
          .from("users")
          .update(withoutStage)
          .eq("id", user.id)
          .select()
          .single())
      }

      if (error) {
        console.error("Profile upsert error:", error)

        if (error.message?.includes("phone")) {
          throw new Error("This phone number already exists. Please login or contact support.")
        }

        throw new Error(`Failed to save profile: ${error.message}`)
      }

      const result = data
       
      console.log("Profile saved successfully:", result)
      return result
    } catch (error) {
      console.error("Error in submitUserProfile:", error)
      throw error
    }
  }

  // Fetch current user profile using user ID
  async function fetchUserProfile() {
    if (!user?.id) {
      throw new Error("User ID is required to fetch profile")
    }

    try {
      console.log("Fetching profile for user ID:", user.id)

      const { data, error } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()

      if (error) {
        console.error("Error fetching user profile:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw new Error(`Failed to fetch profile: ${error.message}`)
      }

      console.log("Profile fetched successfully:", data)
      return data
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
      throw error
    }
  }

  // Save and next handler
  async function handleSaveAndNext(stagePayload: Partial<OnboardingData>) {
    setIsLoading(true)
    setError(null)

    try {
      const stageData = stagePayload

      // Validate stage data before saving
      if (Object.keys(stageData).length > 0) {
        validateStageData(stageData, stage)

        // Sanitize the payload - removes null/undefined/empty string values
        const payload = sanitizePayload(stageData)

        debugLog("Original stage data:", stageData)
        debugLog("Sanitized payload:", payload)

        // Only make the database call if we have data to save
        if (Object.keys(payload).length > 0) {
          // Use the new submitUserProfile function
          const updatedProfile = await submitUserProfile(payload)

          debugLog("Successfully saved data")

          // Update local profile state with the returned data
          setProfile({ ...profile, ...updatedProfile })
        }
      }

      // Move to next stage or complete
      if (stage < 4) {
        setStage(stage + 1)
      } else {
        // Mark onboarding as complete and set verification status to pending
        const completionData = {
          is_onboarded: true,
          verification_status: "pending" as const,
        }

        await submitUserProfile(completionData as any)

        setShowCompletion(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 5000)
      }
    } catch (err) {
      console.error("Error saving stage data:", err)
      setError((err as Error).message)
      setIsLoading(false)
      return
    } finally {
      setIsLoading(false)
    }
  }

  const validateStageData = (stageData: Partial<OnboardingData>, currentStage: number) => {
    switch (currentStage) {
      case 1:
        // Validate gender
        if (stageData.gender !== undefined && !validateEnumField("gender", stageData.gender)) {
          throw new Error(
            `Invalid gender value. Must be one of: ${VALID_VALUES.gender.filter((v) => v !== null).join(", ")}`,
          )
        }

        // Required fields validation
        if (!stageData.gender) {
          throw new Error("Please select your gender before proceeding.")
        }
        if (
          !stageData.birthdate ||
          !stageData.height_ft ||
          !stageData.height_in ||
          !stageData.country_id ||
          !stageData.state_id ||
          !stageData.city_id
        ) {
          throw new Error("Please fill in all required fields before proceeding.")
        }
        break
      case 2:
        if (!stageData.education || !stageData.profession) {
          throw new Error("Please fill in all required fields before proceeding.")
        }
        break
      case 3:
        // Validate enum fields
        if (stageData.diet !== undefined && !validateEnumField("diet", stageData.diet)) {
          throw new Error(
            `Invalid diet value. Must be one of: ${VALID_VALUES.diet.filter((v) => v !== null).join(", ")}`,
          )
        }
        if (
          stageData.temple_visit_freq !== undefined &&
          !validateEnumField("temple_visit_freq", stageData.temple_visit_freq)
        ) {
          throw new Error(
            `Invalid temple visit frequency. Must be one of: ${VALID_VALUES.temple_visit_freq.filter((v) => v !== null).join(", ")}`,
          )
        }
        if (
          stageData.vanaprastha_interest !== undefined &&
          !validateEnumField("vanaprastha_interest", stageData.vanaprastha_interest)
        ) {
          throw new Error(
            `Invalid vanaprastha interest. Must be one of: ${VALID_VALUES.vanaprastha_interest.filter((v) => v !== null).join(", ")}`,
          )
        }
        if (
          stageData.artha_vs_moksha !== undefined &&
          !validateEnumField("artha_vs_moksha", stageData.artha_vs_moksha)
        ) {
          throw new Error(
            `Invalid artha vs moksha preference. Must be one of: ${VALID_VALUES.artha_vs_moksha.filter((v) => v !== null).join(", ")}`,
          )
        }

        if (!stageData.diet) {
          throw new Error("Please select your diet preference before proceeding.")
        }
        break
      case 4:
        // Only require about_me, ideal_partner_notes is optional
        // Note: The full bloom stage sends ideal_partner_notes
        if (!stageData.about_me && !stageData.ideal_partner_notes) {
          throw new Error("Please fill in at least the 'About Me' section before proceeding.")
        }

        if ((stageData.user_photos ?? profile.user_photos)?.length < 3) {
          throw new Error("Please upload at least 3 photos to complete your profile.")
        }
        break
    }
    return true
  }

  const handleBack = () => {
    if (stage > 1) {
      setStage(stage - 1)
    }
    setError(null)
  }

  const handleSkip = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // For skip, we don't save any data, just move to the next stage
      if (stage < 4) {
        setStage(stage + 1)
      } else {
        // If skipping the final stage, still mark onboarding as complete
        const completionData = {
          is_onboarded: true,
          verification_status: "pending" as const,
        }

        await submitUserProfile(completionData as any)

        setShowCompletion(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 5000)
      }
    } catch (error: any) {
      console.error("Error skipping stage:", error)
      setError(error.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const stageNames = [
    "Mobile Verification",
    "Personal Info",
    "Professional Info",
    "Spiritual Preferences",
    "About You & Photos",
  ]

  // Show completion loading screen
  if (showCompletion) {
    return (
      <FullScreenLoading
        title="Profile Complete! 🎉"
        subtitle="Your spiritual journey is ready to begin"
        messages={[
          "Finalizing your sacred profile...",
          "Preparing your spiritual matches...",
          "Setting up your dashboard...",
          "Welcome to your dharma journey!",
        ]}
        duration={5000}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">
      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Progress bar */}
          <ProgressBar currentStage={stage} totalStages={4} stageName={stageNames[stage - 1]} />

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Stage content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20 max-w-2xl mx-auto">
            {/* Render current stage based on state */}
            {stage === 1 && (
              <StemStage
                formData={formData}
                onChange={handleFormChange}
                onNext={handleSaveAndNext}
                isLoading={isLoading}
                error={error}
              />
            )}
            {stage === 2 && (
              <LeavesStage
                formData={formData}
                onChange={handleFormChange}
                onNext={handleSaveAndNext}
                isLoading={isLoading}
                error={error}
              />
            )}
            {stage === 3 && (
              <PetalsStage
                formData={formData}
                onChange={handleFormChange}
                onNext={handleSaveAndNext}
                isLoading={isLoading}
                error={error}
              />
            )}
            {stage === 4 && (
              <FullBloomStage
                formData={formData}
                onChange={handleFormChange}
                onNext={handleSaveAndNext}
                isLoading={isLoading}
                error={error}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="max-w-2xl mx-auto">
            <NavigationButtons
              currentStage={stage}
              totalStages={4}
              onBack={handleBack}
              onNext={() => handleSaveAndNext({})}
              onSkip={handleSkip}
              isLoading={isLoading}
              canProceed={true}
            />
          </div>

          {/* Trust Section at the bottom */}
          <Card className="mt-8 max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Image src="/logo.png" alt="DharmaSaathi Logo" width={120} height={40} className="mb-4" />
              <p className="text-sm text-gray-600">
                Your data is safe with DharmaSaathi. We are committed to protecting your privacy and ensuring a secure
                experience.
              </p>
              <p className="text-xs text-gray-500 mt-2">Learn more about our privacy policy.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

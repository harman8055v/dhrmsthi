"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { debugLog } from "@/lib/logger"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"
import type { OnboardingData, OnboardingProfile } from "@/lib/types/onboarding"
import { VALID_VALUES, validateEnumField } from "@/lib/types/onboarding"
import ProgressBar from "./progress-bar"
import NavigationButtons from "./navigation-buttons"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import FullScreenLoading from "@/components/full-screen-loading"

// Dynamic imports for stages
import SeedStage from "./stages/seed-stage"
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
  return Object.entries(data).reduce(
    (acc, [key, val]) => {
      if (val === null || val === undefined) return acc
      if (typeof val === "string" && val.trim() === "") return acc
      acc[key as keyof T] = val
      return acc
    },
    {} as Partial<T>,
  )
}

export default function OnboardingContainer({ user, profile, setProfile }: OnboardingContainerProps) {
  const [stage, setStage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [didSubmit, setDidSubmit] = useState(false)
  const router = useRouter()

  // Initialize form state with null for all enum/text fields and [] for arrays
  const [formData, setFormData] = useState<OnboardingData>({
    phone: user?.phone || profile?.phone || '',
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
  })

  // Initialize form data from existing profile and saved progress
  useEffect(() => {
    if (profile) {
      // Try to load saved progress
      const savedProgress = loadSavedProgress()
      
      // Merge saved progress with profile data (profile takes precedence)
      setFormData({
        phone: user?.phone || profile.phone || savedProgress?.formData.phone || '',
        email_verified: !!user?.email_confirmed_at || profile.email_verified || false,
        mobile_verified: !!user?.phone_confirmed_at || profile.mobile_verified || false,
        gender: profile.gender || savedProgress?.formData.gender || null,
        birthdate: profile.birthdate || savedProgress?.formData.birthdate || null,
        height_ft: profile.height_ft ?? savedProgress?.formData.height_ft ?? null,
        height_in: profile.height_in ?? savedProgress?.formData.height_in ?? null,
        country_id: profile.country_id || savedProgress?.formData.country_id || null,
        state_id: profile.state_id || savedProgress?.formData.state_id || null,
        city_id: profile.city_id || savedProgress?.formData.city_id || null,
        education: profile.education || savedProgress?.formData.education || null,
        profession: profile.profession || savedProgress?.formData.profession || null,
        annual_income: profile.annual_income || savedProgress?.formData.annual_income || null,
        marital_status: profile.marital_status || savedProgress?.formData.marital_status || null,
        diet: profile.diet || savedProgress?.formData.diet || null,
        temple_visit_freq: profile.temple_visit_freq || savedProgress?.formData.temple_visit_freq || null,
        vanaprastha_interest: profile.vanaprastha_interest || savedProgress?.formData.vanaprastha_interest || null,
        artha_vs_moksha: profile.artha_vs_moksha || savedProgress?.formData.artha_vs_moksha || null,
        spiritual_org: Array.isArray(profile.spiritual_org)
          ? profile.spiritual_org
          : profile.spiritual_org
            ? [profile.spiritual_org]
            : savedProgress?.formData.spiritual_org || [],
        daily_practices: profile.daily_practices || savedProgress?.formData.daily_practices || [],
        user_photos: profile.user_photos || savedProgress?.formData.user_photos || [],
        ideal_partner_notes: profile.ideal_partner_notes || savedProgress?.formData.ideal_partner_notes || null,
        favorite_spiritual_quote: profile.favorite_spiritual_quote || savedProgress?.formData.favorite_spiritual_quote || null,
        about_me: profile.about_me || savedProgress?.formData.about_me || null,
      })

      // Check if we have a saved stage that's further along
      if (savedProgress?.stage) {
        // Only use saved stage if it's valid for current data state
        const savedStage = savedProgress.stage
        if (savedStage > 1 && (user?.phone_confirmed_at || profile.mobile_verified)) {
          setStage(Math.min(savedStage, 5))
          return
        }
      }

      // Otherwise determine current stage based on completed data
      if (!user?.phone_confirmed_at && !profile.mobile_verified) {
        setStage(1)
      } else if (!profile.gender || !profile.birthdate || !profile.height_ft || !profile.height_in) {
        setStage(2)
      } else if (!profile.education || !profile.profession) {
        setStage(3)
      } else if (!profile.diet) {
        setStage(4)
      } else if (!profile.ideal_partner_notes) {
        setStage(5)
      }
    }
  }, [profile, user])

  // Load saved progress from localStorage
  const loadSavedProgress = (): { stage: number; formData: Partial<OnboardingData> } | null => {
    if (typeof window === "undefined") return null
    
    try {
      const saved = localStorage.getItem("onboardingProgress")
      if (!saved) return null
      
      const data = JSON.parse(saved)
      // Check if saved data is not too old (24 hours)
      if (data.timestamp && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        return { stage: data.stage || 1, formData: data.formData || {} }
      }
      
      // Clear old saved data
      localStorage.removeItem("onboardingProgress")
    } catch (error) {
      console.error("Error loading saved progress:", error)
    }
    
    return null
  }

  // Save progress to localStorage
  const saveProgress = () => {
    if (typeof window === "undefined") return
    
    try {
      const progressData = {
        stage,
        formData,
        timestamp: Date.now(),
        userId: user?.id || profile?.id
      }
      localStorage.setItem("onboardingProgress", JSON.stringify(progressData))
    } catch (error) {
      console.error("Error saving progress:", error)
    }
  }

  // Save progress whenever stage or form data changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      saveProgress()
    }, 1000) // Debounce for 1 second
    
    return () => clearTimeout(debounceTimer)
  }, [stage, formData])

  // Clear saved progress after successful submission
  const clearSavedProgress = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("onboardingProgress")
      } catch (error) {
        console.error("Error clearing saved progress:", error)
      }
    }
  }

  const handleFormChange = (updates: Partial<OnboardingData>) => {
    setFormData((prev: OnboardingData) => ({ ...prev, ...updates }))
    setError(null) // Clear any previous errors
  }

  // Comprehensive validation before submission
  const validateAllRequiredFields = (data: OnboardingData): string | null => {
    // Check core required fields
    if (!data.mobile_verified) {
      return "Mobile number must be verified before submission"
    }
    
    // Personal info
    if (!data.gender || !data.birthdate || data.height_ft === null || data.height_in === null) {
      return "Please complete all personal information (gender, birthdate, height)"
    }
    
    // Location
    if (!data.country_id || !data.state_id || !data.city_id) {
      return "Please select your location (country, state, and city)"
    }
    
    // Professional info
    if (!data.education || !data.profession) {
      return "Please complete your professional information"
    }
    
    // Spiritual preferences
    if (!data.diet) {
      return "Please select your dietary preference"
    }
    
    // About section - now optional
    // No validation for about_me - keeping it simple
    
    // Photos
    if (!data.user_photos || data.user_photos.length < 3) {
      return "Please upload at least 3 photos"
    }
    
    return null
  }

  // Replace the complex submitUserProfile function with the simpler handleSubmit
  const handleSubmit = async (values: any = null) => {
    // Double check if already submitting
    if (didSubmit || isLoading) {
      console.warn('Submission already in progress, ignoring duplicate request');
      return;
    }
    
    // Validate all required fields before submission
    const validationError = validateAllRequiredFields(values || formData)
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      return
    }
    
    setDidSubmit(true);
    setIsLoading(true);
    setError(null);

    try {
      // Pull the latest auth user (OTP verify may have produced a new session)
      const {
        data: { user: freshUser },
        error: authErr,
      } = await supabase.auth.getUser()

      if (authErr || !freshUser) {
        throw new Error('Missing auth user – please refresh and try again')
      }

    // Prefer passed-in values (from mergedFormData) but fall back to current state
    const source = values ?? formData

    // Get user data from localStorage (from signup) or from existing profile
    let userData = {
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      full_name: profile?.full_name || '',
      email: freshUser.email || profile?.email || ''
    }

    // Try to get user data from localStorage if not in profile
    if (typeof window !== 'undefined' && (!userData.first_name || !userData.last_name)) {
      try {
        const signupDataRaw = localStorage.getItem('signupData')
        if (signupDataRaw) {
          const signupData = JSON.parse(signupDataRaw)
          userData = {
            first_name: signupData.first_name || userData.first_name,
            last_name: signupData.last_name || userData.last_name,
            full_name: signupData.full_name || userData.full_name || `${signupData.first_name} ${signupData.last_name}`.trim(),
            email: signupData.email || userData.email
          }
        }
      } catch (e) {
      }
    }

    // Update phone number in Supabase auth if mobile is verified
    if (source.mobile_verified && source.phone && source.phone !== freshUser.phone) {
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          phone: source.phone
        })
        if (updateError) {
        } else {
        }
      } catch (e) {
      }
    }

    // Get referral code from localStorage
    let referralCode: string | null = null;
    try {
      if (typeof window !== 'undefined') {
        // Check signupData first
        const signupDataRaw = localStorage.getItem('signupData')
        if (signupDataRaw) {
          const signupData = JSON.parse(signupDataRaw)
          referralCode = signupData.referral_code || null
        }
        
        // If not found, check backup
        if (!referralCode) {
          const backupCode = localStorage.getItem('pendingReferralCode')
          if (backupCode) {
            referralCode = backupCode
          }
        }
        
        if (!referralCode) {
        }
      }
    } catch (e) {
    }

    const payload = {
      id: freshUser.id,
      phone: source.phone || freshUser.phone,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      full_name: userData.full_name,
      email_verified: source.email_verified,
      mobile_verified: source.mobile_verified,
      gender: source.gender,
      birthdate: source.birthdate,
      height_ft: source.height_ft,
      height_in: source.height_in,
      country_id: source.country_id,
      state_id: source.state_id,
      city_id: source.city_id,
      education: source.education,
      profession: source.profession,
      annual_income: source.annual_income,
      marital_status: source.marital_status,
      diet: source.diet,
      temple_visit_freq: source.temple_visit_freq,
      vanaprastha_interest: source.vanaprastha_interest,
      artha_vs_moksha: source.artha_vs_moksha,
      spiritual_org: source.spiritual_org,
      daily_practices: source.daily_practices,
      user_photos: source.user_photos,
      ideal_partner_notes: source.ideal_partner_notes,
      favorite_spiritual_quote: source.favorite_spiritual_quote,
      about_me: source.about_me,
      is_onboarded: true,
      verification_status: "pending" as const,
      referred_by: referralCode // Store the referral code directly
    };

    let { error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'id', ignoreDuplicates: false });

    // Duplicate phone constraint? retry without phone key so we still create/update the row
    if (error && error.code === '23505' && error.message?.includes('phone')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { phone: _p, ...withoutPhone } = payload as any;
      ({ error } = await supabase
        .from('users')
        .upsert(withoutPhone, { onConflict: 'id', ignoreDuplicates: false }));
    }

    if (error) {
      throw new Error(error.message);
    }
    // After successful upsert, process referral code if present (non-blocking)
    try {
      if (typeof window !== 'undefined') {
        const signupDataRaw = localStorage.getItem('signupData')
        if (signupDataRaw) {
          const signupData = JSON.parse(signupDataRaw)
          const referralCode = signupData.referral_code
          if (referralCode && freshUser.id) {
            // Fire-and-forget with a short timeout; don't block onboarding
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 3000)
            void fetch('/api/referrals/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ newUserId: freshUser.id, referralCode }),
              signal: controller.signal,
            }).catch(() => {}).finally(() => clearTimeout(timeout))

            // Remove referral code from localStorage to avoid duplicate submissions
            signupData.referral_code = null
            localStorage.setItem('signupData', JSON.stringify(signupData))
          }
        }
      }
    } catch (referralError) {
      console.error('Referral code processing error:', referralError);
    }
    
    // Successfully submitted, clear saved progress and redirect to welcome
    clearSavedProgress();
    router.replace('/onboarding/welcome');
    
    } catch (error: any) {
      // Handle submission errors
      console.error('Profile submission error:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
      setDidSubmit(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch current user profile using user ID
  async function fetchUserProfile() {
    if (!user?.id) {
      throw new Error("User ID is required to fetch profile")
    }

    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()

      if (error) {
        throw new Error(`Failed to fetch profile: ${error.message}`)
      }

      return data
    } catch (error) {
      throw error
    }
  }

  // Simplified save and next handler - just navigates between stages without saving
  async function handleSaveAndNext(stagePayload: Partial<OnboardingData>) {
    setIsLoading(true)
    setError(null)

    try {
      const stageData = stagePayload

      // Validate stage data before proceeding
      if (Object.keys(stageData).length > 0) {
        validateStageData(stageData, stage)
        // Update form data with stage data
        setFormData(prev => ({ ...prev, ...stageData }))
      }

      // Build a merged version of form data including latest stage inputs
      const mergedFormData = { ...formData, ...stageData }

      // Move to next stage or complete
      if (stage < 5) {
        setStage(stage + 1)
      } else {
        // On final stage, submit all data (use mergedFormData so nothing is lost)
        await handleSubmit(mergedFormData)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const validateStageData = (stageData: Partial<OnboardingData>, currentStage: number) => {
    switch (currentStage) {
      case 1: // Mobile Verification Stage
        if (!stageData.mobile_verified) {
          throw new Error("Please verify your mobile number before proceeding.")
        }
        break
      case 2:
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
      case 3:
        if (!stageData.education || !stageData.profession) {
          throw new Error("Please fill in all required fields before proceeding.")
        }
        break
      case 4:
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
      case 5:
        // Only require about_me, ideal_partner_notes is optional
        // Note: The full bloom stage sends ideal_partner_notes
        if (!stageData.about_me && !stageData.ideal_partner_notes) {
          throw new Error("Please fill in at least the 'About Me' section before proceeding.")
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
      if (stage < 5) {
        setStage(stage + 1)
      } else {
        // If skipping the final stage, submit with current data
        await handleSubmit(formData)
      }
    } catch (error: any) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">
      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Progress bar */}
          {stage !== 1 && (
            <ProgressBar currentStage={stage} totalStages={5} stageName={stageNames[stage - 1]} />
          )}

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
              <SeedStage
                formData={formData}
                onChange={handleFormChange}
                onNext={handleSaveAndNext}
                isLoading={isLoading}
                user={user}
                error={error}
              />
            )}
            {stage === 2 && (
              <StemStage
                formData={formData}
                onChange={handleFormChange}
                onNext={handleSaveAndNext}
                isLoading={isLoading}
                error={error}
              />
            )}
            {stage === 3 && (
              <LeavesStage
                formData={formData}
                onChange={handleFormChange}
                onNext={handleSaveAndNext}
                isLoading={isLoading}
                error={error}
              />
            )}
            {stage === 4 && (
              <PetalsStage
                formData={formData}
                onChange={handleFormChange}
                onNext={handleSaveAndNext}
                isLoading={isLoading}
                error={error}
              />
            )}
            {stage === 5 && (
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
              totalStages={5}
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

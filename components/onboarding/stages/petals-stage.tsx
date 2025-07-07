"use client"

import type React from "react"
import { useState } from "react"
import { Loader2, X } from "lucide-react"
import type { OnboardingData } from "@/lib/types/onboarding"
import { VALID_VALUES } from "@/lib/types/onboarding"
import { SPIRITUAL_ORGS } from "@/lib/constants/spiritual-orgs"
import { DAILY_PRACTICES } from "@/lib/constants/daily-practices"

interface PetalsStageProps {
  formData: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
  onNext: (updates: Partial<OnboardingData>) => void // Changed
  isLoading: boolean
  error?: string | null
}

export default function PetalsStage({ formData, onChange, onNext, isLoading, error }: PetalsStageProps) {
  // Destructure with null defaults and ensure arrays
  const {
    spiritual_org = [],
    daily_practices = [],
    diet = null,
    temple_visit_freq = null,
    vanaprastha_interest = null,
    artha_vs_moksha = null,
  } = formData
  
  // Ensure spiritual_org and daily_practices are always arrays
  const safeSpiritual = Array.isArray(spiritual_org) ? spiritual_org : []
  const safePractices = Array.isArray(daily_practices) ? daily_practices : []

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    onChange({ ...formData, [name]: value || null })

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleMultiSelect = (name: keyof Pick<OnboardingData, "spiritual_org" | "daily_practices">, value: string) => {
    const currentValues = formData[name] || []

    if (currentValues.includes(value)) {
      onChange({
        ...formData,
        [name]: currentValues.filter((v) => v !== value),
      })
    } else {
      onChange({
        ...formData,
        [name]: [...currentValues, value],
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!diet) {
      newErrors.diet = "Please select your diet preference"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      const dataToSave: Partial<OnboardingData> = {
        spiritual_org: formData.spiritual_org || [],
        daily_practices: formData.daily_practices || [],
        diet,
        temple_visit_freq,
        vanaprastha_interest,
        artha_vs_moksha,
      }
      onNext(dataToSave) // Pass data to parent for saving and next stage
    }
  }

  const handleSkip = () => {
    const dataToSave: Partial<OnboardingData> = {
      spiritual_org: formData.spiritual_org || [],
      daily_practices: formData.daily_practices || [],
      diet: null,
      temple_visit_freq: null,
      vanaprastha_interest: null,
      artha_vs_moksha: null,
    }
    onChange(dataToSave) // Update local form data
    onNext(dataToSave) // Trigger save and next stage
  }

  const spiritualOrgs = [...SPIRITUAL_ORGS]

  const dailyPractices = [...DAILY_PRACTICES]

  const dietOptions = VALID_VALUES.diet.filter((d) => d !== null)
  const templeFreqOptions = VALID_VALUES.temple_visit_freq.filter((t) => t !== null)
  const vanaprasthaOptions = VALID_VALUES.vanaprastha_interest.filter((v) => v !== null)
  const arthaMokshaOptions = VALID_VALUES.artha_vs_moksha.filter((a) => a !== null)

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">🌸</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose your spiritual petals</h2>
        <p className="text-gray-600">Share your spiritual practices and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Spiritual Organizations */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Spiritual Organizations (Select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {spiritualOrgs.map((org) => (
              <button
                key={org}
                type="button"
                onClick={() => handleMultiSelect("spiritual_org", org)}
                className={`px-3 py-1 text-sm rounded-full ${
                  safeSpiritual.includes(org) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {org}
              </button>
            ))}
          </div>
          {safeSpiritual.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {safeSpiritual.map((org) => (
                <span
                  key={org}
                  className="inline-flex items-center bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs"
                >
                  {org}
                  <button
                    type="button"
                    onClick={() => handleMultiSelect("spiritual_org", org)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Daily Practices */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Daily Spiritual Practices (Select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {dailyPractices.map((practice) => (
              <button
                key={practice}
                type="button"
                onClick={() => handleMultiSelect("daily_practices", practice)}
                className={`px-3 py-1 text-sm rounded-full ${
                  safePractices.includes(practice)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {practice}
              </button>
            ))}
          </div>
          {safePractices.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {safePractices.map((practice) => (
                <span
                  key={practice}
                  className="inline-flex items-center bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs"
                >
                  {practice}
                  <button
                    type="button"
                    onClick={() => handleMultiSelect("daily_practices", practice)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Diet */}
        <div className="space-y-2">
          <label htmlFor="diet" className="block text-sm font-medium text-foreground">
            Diet Preference *
          </label>
          <select
            id="diet"
            name="diet"
            value={diet || ""}
            onChange={handleChange}
            className={`w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary ${
              errors.diet ? "border-red-300" : ""
            }`}
          >
            <option value="">Select diet preference</option>
            {dietOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.diet && <p className="text-red-500 text-sm">{errors.diet}</p>}
        </div>

        {/* Temple Visit Frequency */}
        <div className="space-y-2">
          <label htmlFor="temple_visit_freq" className="block text-sm font-medium text-foreground">
            Temple Visit Frequency
          </label>
          <select
            id="temple_visit_freq"
            name="temple_visit_freq"
            value={temple_visit_freq || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select frequency</option>
            {templeFreqOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Vanaprastha Interest */}
        <div className="space-y-2">
          <label htmlFor="vanaprastha_interest" className="block text-sm font-medium text-foreground">
            Interest in Vanaprastha (Spiritual Retirement)
          </label>
          <select
            id="vanaprastha_interest"
            name="vanaprastha_interest"
            value={vanaprastha_interest || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select interest level</option>
            {vanaprasthaOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Artha vs Moksha */}
        <div className="space-y-2">
          <label htmlFor="artha_vs_moksha" className="block text-sm font-medium text-foreground">
            Balance between Material Prosperity (Artha) and Spiritual Liberation (Moksha)
          </label>
          <select
            id="artha_vs_moksha"
            name="artha_vs_moksha"
            value={artha_vs_moksha || ""}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select your preference</option>
            {arthaMokshaOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Display any server errors */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : (
              "Next"
            )}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={isLoading}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Skip
          </button>
        </div>
      </form>
    </div>
  )
}

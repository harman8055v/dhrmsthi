"use client"

import type React from "react"
import { useState } from "react"
import { Loader2, GraduationCap, Briefcase, DollarSign } from "lucide-react"
import type { OnboardingData } from "@/lib/types/onboarding"

interface LeavesStageProps {
  formData: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
  onNext: (updates: Partial<OnboardingData>) => void // Changed
  isLoading: boolean
  error?: string | null
}

export default function LeavesStage({ formData, onChange, onNext, isLoading, error }: LeavesStageProps) {
  // Destructure with null defaults
  const { education = null, profession = null, annual_income = null } = formData

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    onChange({ ...formData, [name]: value || null })

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!education) {
      newErrors.education = "Please select your education level"
    }

    if (!profession?.trim()) {
      newErrors.profession = "Please enter your profession"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      const dataToSave: Partial<OnboardingData> = {
        education,
        profession,
        annual_income,
      }
      onNext(dataToSave) // Pass data to parent for saving and next stage
    }
  }

  const handleSkip = () => {
    const dataToSave: Partial<OnboardingData> = {
      education: null,
      profession: null,
      annual_income: null,
    }
    onChange(dataToSave) // Update local form data
    onNext(dataToSave) // Trigger save and next stage
  }

  const incomeRanges = [
    "Less than ₹5,00,000",
    "₹5,00,000 - ₹10,00,000",
    "₹10,00,000 - ₹15,00,000",
    "₹15,00,000 - ₹25,00,000",
    "₹25,00,000 - ₹50,00,000",
    "₹50,00,000 - ₹75,00,000",
    "₹75,00,000 - ₹1,00,00,000",
    "More than ₹1,00,00,000",
    "Prefer not to say",
  ]

  const educationLevels = [
    "High School",
    "Diploma",
    "Bachelor's Degree",
    "Master's Degree",
    "Doctorate",
    "Professional Degree",
    "Other",
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">🍃</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Name your strengths</h2>
        <p className="text-gray-600">Share your professional background and achievements</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Education */}
        <div className="space-y-2">
          <label htmlFor="education" className="flex items-center text-sm font-semibold text-gray-700">
            <GraduationCap className="w-4 h-4 mr-2" />
            Highest Education *
          </label>
          <select
            id="education"
            name="education"
            value={education || ""}
            onChange={handleChange}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
              errors.education ? "border-red-300" : "border-gray-200"
            }`}
          >
            <option value="">Select your education level</option>
            {educationLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          {errors.education && <p className="text-red-500 text-sm">{errors.education}</p>}
        </div>

        {/* Profession */}
        <div className="space-y-2">
          <label htmlFor="profession" className="flex items-center text-sm font-semibold text-gray-700">
            <Briefcase className="w-4 h-4 mr-2" />
            Profession *
          </label>
          <input
            type="text"
            id="profession"
            name="profession"
            value={profession || ""}
            onChange={handleChange}
            placeholder="e.g. Software Engineer, Doctor, Teacher, Business Owner"
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
              errors.profession ? "border-red-300" : "border-gray-200"
            }`}
          />
          {errors.profession && <p className="text-red-500 text-sm">{errors.profession}</p>}
        </div>

        {/* Annual Income */}
        <div className="space-y-2">
          <label htmlFor="annual_income" className="flex items-center text-sm font-semibold text-gray-700">
            <DollarSign className="w-4 h-4 mr-2" />
            Annual Income
          </label>
          <select
            id="annual_income"
            name="annual_income"
            value={annual_income || ""}
            onChange={handleChange}
            className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors border-gray-200"
          >
            <option value="">Select your income range (optional)</option>
            {incomeRanges.map((range) => (
              <option key={range} value={range}>
                {range}
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
            className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </span>
            ) : (
              "Continue to Spiritual Preferences"
            )}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={isLoading}
            className="px-6 py-4 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Skip
          </button>
        </div>
      </form>
    </div>
  )
}

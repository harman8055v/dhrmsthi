"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Loader2 } from "lucide-react"
import type { OnboardingData } from "@/lib/types/onboarding"
import { VALID_VALUES } from "@/lib/types/onboarding"
import { MOTHER_TONGUES } from "@/lib/constants/mother-tongues"
import LocationSelector, { type LocationFormState, validateLocation } from "@/components/location-selector"

interface StemStageProps {
  formData: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
  onNext: (updates: Partial<OnboardingData>) => void
  isLoading: boolean
  error?: string | null
}

export default function StemStage({ formData, onChange, onNext, isLoading, error }: StemStageProps) {
  // Initialize form state with current data
  const [localFormData, setLocalFormData] = useState({
    gender: formData.gender || null,
    birthdate: formData.birthdate || null,
    height_ft: formData.height_ft || null,
    height_in: formData.height_in || null,
  })

  // Location state - initialize with existing data or defaults
  const [locationState, setLocationState] = useState<LocationFormState>({
    country_id: formData.country_id || null,
    state_id: formData.state_id || null,
    city_id: formData.city_id || null,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validGenderOptions = VALID_VALUES.gender.filter((g) => g !== null) as Array<"Male" | "Female" | "Other">

  const handleInputChange = useCallback(
    (field: string, value: any) => {
      const newValue = value || null
      setLocalFormData((prev) => ({
        ...prev,
        [field]: newValue,
      }))

      // Update parent immediately
      onChange({ [field]: newValue })

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }))
      }
    },
    [onChange, errors],
  )

  const handleLocationChange = useCallback(
    (newLocation: LocationFormState) => {
      setLocationState(newLocation)

      // Update parent immediately
      onChange({
        country_id: newLocation.country_id,
        state_id: newLocation.state_id,
        city_id: newLocation.city_id,
      })

      // Clear location error when user makes a selection
      if (errors.location) {
        setErrors((prev) => ({ ...prev, location: "" }))
      }
    },
    [onChange, errors.location],
  )

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Gender validation
    if (!localFormData.gender) {
      newErrors.gender = "Please select your gender"
    }

    // Birthdate validation
    if (!localFormData.birthdate) {
      newErrors.birthdate = "Please enter your birthdate"
    } else {
      const birthDate = new Date(localFormData.birthdate)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        // Adjust age if birthday hasn't occurred this year
      }

      if (age < 18) {
        newErrors.birthdate = "You must be at least 18 years old"
      }
      if (age > 100) {
        newErrors.birthdate = "Please enter a valid birthdate"
      }
    }

    // Height validation
    if (!localFormData.height_ft || !localFormData.height_in) {
      newErrors.height = "Please enter your height"
    }

    // Location validation
    if (!validateLocation(locationState, true)) {
      newErrors.location = "Please select your complete location (Country, State, and City)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      const dataToSave: Partial<OnboardingData> = {
        gender: localFormData.gender,
        birthdate: localFormData.birthdate,
        height_ft: localFormData.height_ft,
        height_in: localFormData.height_in,
        country_id: locationState.country_id,
        state_id: locationState.state_id,
        city_id: locationState.city_id,
      }
      onNext(dataToSave)
    }
  }

  const handleSkip = () => {
    const dataToSave: Partial<OnboardingData> = {
      gender: null,
      birthdate: null,
      height_ft: null,
      height_in: null,
      country_id: null,
      state_id: null,
      city_id: null,
    }
    onNext(dataToSave)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">🌱</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's sprout your profile</h2>
        <p className="text-gray-600">Tell us about yourself to help us find your perfect match</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Gender Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">Gender *</label>
          <div className="grid grid-cols-3 gap-3">
            {validGenderOptions.map((option) => (
              <label
                key={option}
                className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  localFormData.gender === option ? "border-orange-500 bg-orange-50" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={option}
                  checked={localFormData.gender === option}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className="sr-only"
                />
                <span
                  className={`text-sm font-medium ${localFormData.gender === option ? "text-orange-600" : "text-gray-700"}`}
                >
                  {option}
                </span>
                {localFormData.gender === option && <div className="ml-2 w-2 h-2 bg-orange-600 rounded-full"></div>}
              </label>
            ))}
          </div>
          {errors.gender && <p className="text-red-500 text-sm">{errors.gender}</p>}
        </div>

        {/* Birthdate */}
        <div className="space-y-2">
          <label htmlFor="birthdate" className="block text-sm font-semibold text-gray-700">
            Date of Birth *
          </label>
          <input
            type="date"
            id="birthdate"
            name="birthdate"
            value={localFormData.birthdate || ""}
            onChange={(e) => handleInputChange("birthdate", e.target.value)}
            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
              errors.birthdate ? "border-red-300" : "border-gray-200"
            }`}
          />
          {errors.birthdate && <p className="text-red-500 text-sm">{errors.birthdate}</p>}
        </div>

        {/* Height */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Height *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="height_ft" className="block text-sm text-gray-600 mb-1">
                Feet
              </label>
              <select
                id="height_ft"
                name="height_ft"
                value={localFormData.height_ft || ""}
                onChange={(e) => handleInputChange("height_ft", e.target.value ? parseInt(e.target.value) : null)}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                  errors.height ? "border-red-300" : "border-gray-200"
                }`}
              >
                <option value="">Select feet</option>
                <option value="4">4'</option>
                <option value="5">5'</option>
                <option value="6">6'</option>
                <option value="7">7'</option>
              </select>
            </div>
            <div>
              <label htmlFor="height_in" className="block text-sm text-gray-600 mb-1">
                Inches
              </label>
              <select
                id="height_in"
                name="height_in"
                value={localFormData.height_in || ""}
                onChange={(e) => handleInputChange("height_in", e.target.value ? parseInt(e.target.value) : null)}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                  errors.height ? "border-red-300" : "border-gray-200"
                }`}
              >
                <option value="">Select inches</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}"
                  </option>
                ))}
              </select>
            </div>
          </div>
          {errors.height && <p className="text-red-500 text-sm">{errors.height}</p>}
        </div>

        {/* Location Selector */}
        <div className="space-y-2">
          <LocationSelector
            value={locationState}
            onChange={handleLocationChange}
            required={true}
            showLabels={true}
            defaultToIndia={true}
          />
          {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
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
              "Continue to Next Stage"
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

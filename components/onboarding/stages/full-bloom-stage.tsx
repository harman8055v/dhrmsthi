"use client"

import type React from "react"
import { useState } from "react"
import { Loader2, Upload, X, Quote } from "lucide-react"
import Image from "next/image"
import type { OnboardingData } from "@/lib/types/onboarding"
import { supabase } from "@/lib/supabase"

interface FullBloomStageProps {
  formData: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
  onNext: (updates: Partial<OnboardingData>) => void // Changed
  isLoading: boolean
  error?: string | null
}

export default function FullBloomStage({ formData, onChange, onNext, isLoading, error }: FullBloomStageProps) {
  // Destructure with null defaults
  const { about_me = null, ideal_partner_notes = null, user_photos = [], favorite_spiritual_quote = null } = formData

  const [localFormData, setLocalFormData] = useState({
    about_me: about_me || "",
    ideal_partner_notes: ideal_partner_notes || "",
    favorite_spiritual_quote: favorite_spiritual_quote || "",
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>(user_photos)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setLocalFormData((prev) => ({ ...prev, [name]: value }))

    // Clear errors
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos = Array.from(e.target.files)
      if (photoUrls.length + photos.length + newPhotos.length <= 6) {
        // Check file sizes
        const maxSize = 5 * 1024 * 1024 // 5MB
        const oversizedFiles = newPhotos.filter(file => file.size > maxSize)
        if (oversizedFiles.length > 0) {
          alert(`Some files are too large. Maximum size is 5MB per photo.`)
          return
        }
        setPhotos((prev) => [...prev, ...newPhotos])
      } else {
        alert("You can upload a maximum of 6 photos")
      }
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveUploadedPhoto = (url: string) => {
    setPhotoUrls((prev) => prev.filter((photoUrl) => photoUrl !== url))
  }

  const uploadPhotos = async () => {
    if (photos.length === 0) return photoUrls

    setUploading(true)
    const uploadedUrls = [...photoUrls]

    try {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser()

      if (authErr || !user) {
        throw new Error("Authentication required for uploading photos")
      }

      for (const photo of photos) {
        const fileExt = photo.name.split(".").pop() || "jpg"
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadErr } = await supabase.storage
          .from("user-photos")
          .upload(filePath, photo, {
            cacheControl: "3600",
            upsert: false,
            contentType: photo.type,
          })

        if (uploadErr) {
          console.error(`Failed to upload ${photo.name}:`, uploadErr)
          throw new Error(`Failed to upload ${photo.name}: ${uploadErr.message || 'Unknown error'}`)
        }

        // For public bucket:
        const {
          data: { publicUrl },
        } = supabase.storage.from("user-photos").getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
        
        // Alternative for private bucket (creates signed URL valid for 1 year):
        // const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        //   .from("user-photos")
        //   .createSignedUrl(filePath, 365 * 24 * 60 * 60) // 1 year
        // 
        // if (signedUrlError) throw signedUrlError
        // uploadedUrls.push(signedUrlData.signedUrl)
      }

      return uploadedUrls
    } catch (error: any) {
      console.error("Error uploading photos:", error)
      // Show user-friendly error message
      const errorMessage = error?.message || 'Failed to upload photos. Please try again.'
      setErrors({ user_photos: errorMessage })
      throw error
    } finally {
      setUploading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!localFormData.about_me.trim()) {
      newErrors.about_me = "Please tell us about yourself"
    }

    // Make photos optional during development/testing
    // Uncomment the following to require photos:
    // if (photoUrls.length + photos.length < 1) {
    //   newErrors.user_photos = "Please upload at least 1 photo"
    // }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // Skip photo upload if no photos selected (for testing)
      let uploadedPhotoUrls = photoUrls
      
      if (photos.length > 0) {
        try {
          uploadedPhotoUrls = await uploadPhotos()
        } catch (uploadError: any) {
          console.error("Photo upload failed:", uploadError)
          // For now, allow continuing without photos during development
          if (!confirm("Photo upload failed. Continue without uploading new photos?")) {
            return
          }
        }
      }

      const dataToSave: Partial<OnboardingData> = {
        about_me: localFormData.about_me.trim() || null,
        ideal_partner_notes: localFormData.ideal_partner_notes.trim() || null,
        favorite_spiritual_quote: localFormData.favorite_spiritual_quote.trim() || null,
        user_photos: uploadedPhotoUrls,
      }

      // Pass the data directly to onNext, which will handle saving and moving to the next stage
      onNext(dataToSave)
    } catch (error: any) {
      console.error("Error submitting form:", error)
      setErrors({ general: error?.message || "Failed to save profile. Please try again." })
    }
  }

  const handleSkip = () => {
    const dataToSave: Partial<OnboardingData> = {
      about_me: null,
      ideal_partner_notes: null,
      favorite_spiritual_quote: null,
      user_photos: [],
    }
    onChange(dataToSave) // Update local form data
    onNext(dataToSave) // Trigger save and next stage
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">🌸</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your blossom is complete—add the finishing touches!</h2>
        <p className="text-gray-600">
          Share your story, spiritual inspiration, and what you're looking for in a partner
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* About Me */}
        <div className="space-y-2">
          <label htmlFor="about_me" className="block text-sm font-medium text-foreground">
            About Me *
          </label>
          <textarea
            id="about_me"
            name="about_me"
            value={localFormData.about_me}
            onChange={handleChange}
            rows={4}
            placeholder="Share your spiritual journey, interests, and what makes you unique..."
            className={`w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary ${
              errors.about_me ? "border-red-300" : ""
            }`}
          />
          {errors.about_me && <p className="text-red-500 text-sm">{errors.about_me}</p>}
        </div>

        {/* Favorite Spiritual Quote */}
        <div className="space-y-2">
          <label
            htmlFor="favorite_spiritual_quote"
            className="block text-sm font-medium text-foreground flex items-center gap-2"
          >
            <Quote className="w-4 h-4 text-orange-500" />
            Favorite Spiritual Quote (Optional)
          </label>
          <textarea
            id="favorite_spiritual_quote"
            name="favorite_spiritual_quote"
            value={localFormData.favorite_spiritual_quote}
            onChange={handleChange}
            rows={3}
            placeholder="Share a spiritual quote that inspires you... (e.g., from Bhagavad Gita, Upanishads, or your spiritual teacher)"
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary bg-gradient-to-r from-orange-50 to-amber-50"
          />
          <p className="text-xs text-gray-500">
            This will be beautifully displayed on your profile to inspire potential matches
          </p>
        </div>

        {/* Partner Expectations */}
        <div className="space-y-2">
          <label htmlFor="ideal_partner_notes" className="block text-sm font-medium text-foreground">
            Partner Expectations (Optional)
          </label>
          <textarea
            id="ideal_partner_notes"
            name="ideal_partner_notes"
            value={localFormData.ideal_partner_notes}
            onChange={handleChange}
            rows={4}
            placeholder="Describe what you're looking for in a spiritual partner..."
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Photo Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Upload Photos (Optional, Max 6)</label>

          {/* Photo Grid */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {/* Existing Photos */}
            {photoUrls.map((url, index) => (
              <div key={`uploaded-${index}`} className="relative aspect-square bg-muted rounded-md overflow-hidden">
                <Image src={url || "/placeholder.svg"} alt={`User photo ${index + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveUploadedPhoto(url)}
                  className="absolute top-1 right-1 bg-background/80 p-1 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* New Photos */}
            {photos.map((photo, index) => (
              <div key={`new-${index}`} className="relative aspect-square bg-muted rounded-md overflow-hidden">
                <Image
                  src={URL.createObjectURL(photo) || "/placeholder.svg"}
                  alt={`New photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-1 right-1 bg-background/80 p-1 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Upload Button */}
            {photoUrls.length + photos.length < 6 && (
              <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-input rounded-md cursor-pointer hover:bg-muted/50">
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Upload</span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" multiple />
              </label>
            )}
          </div>
        </div>

        {/* Display any server errors */}
        {(error || errors.user_photos || errors.general) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error || errors.user_photos || errors.general}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading || uploading}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploading ? "Uploading photos..." : "Processing..."}
              </span>
            ) : (
              "Complete Profile"
            )}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={isLoading || uploading}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Skip
          </button>
        </div>
      </form>
    </div>
  )
}

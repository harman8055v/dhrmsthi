"use client"

import React from "react"
import { useState } from "react"
import { Loader2, Upload, X, Quote } from "lucide-react"
import Image from "next/image"
import type { OnboardingData } from "@/lib/types/onboarding"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { userService } from "@/lib/data-service"

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
  const [uploading, setUploading] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>(user_photos)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setLocalFormData((prev) => ({ ...prev, [name]: value }))

    // Clear errors
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  // Helper to extract storage path from URL or return as-is if already a path
  function getStoragePath(imageUrl: string) {
    if (!imageUrl) return imageUrl;
    if (!imageUrl.startsWith("http")) return imageUrl;
    // Extract after /user-photos/
    const match = imageUrl.match(/user-photos\/([^?]+)/);
    return match ? decodeURIComponent(match[1]) : imageUrl;
  }

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)
      // Get authenticated user ID (auth.uid())
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        toast.error("User not authenticated. Please log in again.")
        setUploading(false)
        return null
      }
      const fileExt = file.name.split('.').pop() ?? 'jpg'
      const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      let { data, error } = await supabase.storage
        .from("user-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        })
      if ((error as any)?.status === 409) {
        ;({ data, error } = await supabase.storage
          .from("user-photos")
          .upload(filePath, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: true,
          }))
      }
      if (error) {
        toast.error(error.message || "Failed to upload image.")
        setUploading(false)
        return null
      }
      return filePath
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image. Please try again.")
      return null
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (imagePath: string) => {
    try {
      const storagePath = getStoragePath(imagePath)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        toast.error("User not authenticated. Please log in again.")
        return
      }
      if (!storagePath.startsWith(user.id)) {
        toast.warning("Cannot delete a file not owned by the current user.")
        return
      }
      const { error: storageError } = await supabase.storage
        .from("user-photos")
        .remove([storagePath])
      if (storageError) {
        toast.error(storageError.message || "Failed to delete image from storage.")
        return
      }
      const newImages = photoUrls.filter((img) => img !== imagePath)
      setPhotoUrls(newImages)
      toast.success("Image removed successfully!")
    } catch (error) {
      console.error("Error removing image:", error)
      toast.error("Failed to remove image. Please try again.")
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return
    const filesArr = Array.from(files)
    for (const file of filesArr) {
      if (photoUrls.length >= 6) {
        toast.error("You can upload a maximum of 6 photos")
        break
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB")
        continue
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file")
        continue
      }
      const uploadedPath = await uploadImage(file)
      if (uploadedPath) {
        setPhotoUrls((prev) => [...prev, uploadedPath])
      }
    }
    // Reset file input value so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!localFormData.about_me.trim()) {
      newErrors.about_me = "Please tell us about yourself"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const dataToSave: Partial<OnboardingData> = {
        about_me: localFormData.about_me.trim() || null,
        ideal_partner_notes: localFormData.ideal_partner_notes.trim() || null,
        favorite_spiritual_quote: localFormData.favorite_spiritual_quote.trim() || null,
        user_photos: photoUrls,
      }

      // Pass the data directly to onNext, which will handle saving and moving to the next stage
      onNext(dataToSave)
    } catch (error) {
      console.error("Error submitting form:", error)
      // You might want to set a local error state here if photo upload fails
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
          <label className="block text-sm font-medium text-foreground">Upload Photos (Max 6)</label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {photoUrls.map((url, index) => (
              <div key={`uploaded-${index}`} className="relative aspect-square bg-muted rounded-md overflow-hidden">
                <Image src={url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${url}`} alt={`User photo ${index + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute top-1 right-1 bg-background/80 p-1 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {photoUrls.length < 6 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-input rounded-md cursor-pointer hover:bg-muted/50"
              >
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Upload"}</span>
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" multiple />
          <p className="text-xs text-gray-500 text-center">Add up to 6 photos. Max 10MB per image.</p>
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

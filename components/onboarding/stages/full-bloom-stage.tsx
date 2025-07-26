"use client"

import React from "react"
import { useState } from "react"
import { Loader2, Upload, X, Quote } from "lucide-react"
import Image from "next/image"
import type { OnboardingData } from "@/lib/types/onboarding"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { userService } from "@/lib/data-service"
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import imageCompression from "browser-image-compression"
import { useRef } from "react"

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
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [cropUploadProgress,setCropUploadProgress]=useState<number>(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

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
      toast.error("Failed to remove image. Please try again.")
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (photoUrls.length >= 6) {
        toast.error("You can upload a maximum of 6 photos")
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size should be less than 10MB")
        return
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file")
        return
      }
      setSelectedFile(file)
      setImageUrl(URL.createObjectURL(file))
      setCropModalOpen(true)
    }
  }

  const getCroppedImg = async (imageSrc: string, crop: any): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const image = new window.Image()
      image.src = imageSrc
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = crop.width
        canvas.height = crop.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(null)
        ctx.drawImage(
          image,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          0,
          0,
          crop.width,
          crop.height
        )
        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/jpeg')
      }
    })
  }

  const handleCropSave = async () => {
    if (!imageUrl || !croppedAreaPixels || !selectedFile) return
    setUploading(true)
    setCropUploadProgress(0)
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    let fakeProgress = 0
    progressIntervalRef.current = setInterval(() => {
      fakeProgress += 3 + Math.random() * 2 // 3-5% per tick
      setCropUploadProgress(Math.min(99, Math.round(fakeProgress)))
    }, 40)
    try {
      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels)
      if (croppedBlob) {
        // Compress the cropped image before upload
        const croppedFile = new File([croppedBlob], selectedFile.name || 'cropped.jpg', { type: 'image/jpeg' })
        const compressed = await imageCompression(croppedFile, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
        })
        const uploadedPath = await uploadImage(compressed)
        if (uploadedPath) {
          // Use the public CDN URL for preview
          const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${uploadedPath}`
          setPhotoUrls((prev) => [...prev, publicUrl])
        }
      }
      setCropUploadProgress(100)
    } catch (error) {
      toast.error("Failed to upload cropped image. Please try again.")
      setCropUploadProgress(0)
    } finally {
      setTimeout(() => {
        setUploading(false)
        setCropUploadProgress(0)
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
        setCropModalOpen(false)
        setSelectedFile(null)
        setImageUrl(null)
        setCrop({ x: 0, y: 0 })
        setZoom(1)
        setCroppedAreaPixels(null)
        setEditIndex(null)
      }, 400)
    }
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
      await onNext(dataToSave)
      // Mark submission as successful for UI feedback
      setSubmissionSuccess(true)
      toast.success("Profile created!")
    } catch (error) {
      // You might want to set a local error state here if photo upload fails
    }
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
          <label className="block text-sm font-medium text-foreground">Upload Photos (Min 3, Max 6)</label>
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
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          <p className="text-xs text-gray-500 text-center">Add at least 3 photos to continue. Max 10MB per image.</p>
          {photoUrls.length > 0 && photoUrls.length < 3 && (
            <p className="text-red-500 text-sm text-center">Please upload at least 3 photos to complete your profile.</p>
          )}
        </div>
        {/* Crop Modal */}
        <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crop Photo</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-72 bg-gray-100">
              {imageUrl && (
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid={true}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              )}
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
              {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="h-2 bg-primary transition-all rounded-full" style={{width: cropUploadProgress + '%'}}></div>
                </div>
              )}
              {uploading && (
                <div className="w-full text-right text-xs text-gray-600 mb-2">{cropUploadProgress}%</div>
              )}
              <DialogFooter>
                <Button onClick={handleCropSave} disabled={uploading} className="w-full">
                  {uploading ? 'Uploading...' : 'Save & Upload'}
                </Button>
                <DialogClose asChild>
                  <Button variant="outline" className="w-full">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Display any server errors */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submissionSuccess || isLoading || uploading || photoUrls.length < 3}
            className={`flex-1 py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
              submissionSuccess ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {submissionSuccess ? (
              "Profile Created!"
            ) : isLoading || uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploading ? "Uploading photos..." : "Processing..."}
              </span>
            ) : (
              "Complete Profile"
            )}
          </button>

          {/* Remove or disable Skip button */}
          <button
            type="button"
            disabled
            className="px-6 py-2 text-gray-400 font-medium cursor-not-allowed bg-gray-100 rounded-md"
            style={{ pointerEvents: 'none' }}
          >
            Skip
          </button>
        </div>
      </form>
    </div>
  )
}

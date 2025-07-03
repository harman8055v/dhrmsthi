"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface ProfileImageUploaderProps {
  userId: string
  currentImages: string[]
  onImagesUpdate: (images: string[]) => void
}

export default function ProfileImageUploader({ userId, currentImages, onImagesUpdate }: ProfileImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)

      // Convert image to base64 for now (alternative to storage)
      const base64Image = await convertToBase64(file)

      // For now, we'll store the base64 image directly in the database
      // In production, you'd want to use proper file storage
      const newImages = [...currentImages, base64Image]

      // Update user profile with new images
      const { error: updateError } = await supabase.from("users").update({ user_photos: newImages }).eq("id", userId)

      if (updateError) throw updateError

      onImagesUpdate(newImages)
      toast.success("Image uploaded successfully!")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (imageUrl: string) => {
    try {
      const newImages = currentImages.filter((img) => img !== imageUrl)

      const { error } = await supabase.from("users").update({ user_photos: newImages }).eq("id", userId)

      if (error) throw error

      onImagesUpdate(newImages)
      toast.success("Image removed successfully!")
    } catch (error) {
      console.error("Error removing image:", error)
      toast.error("Failed to remove image. Please try again.")
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast.error("Image size should be less than 10MB")
        return
      }

      // Check if it's a valid image type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file")
        return
      }

      uploadImage(file)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {currentImages.map((imageUrl, index) => (
          <div key={index} className="relative group">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt={`Profile ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg"
              }}
            />
            <Button
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeImage(imageUrl)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}

        {currentImages.length < 6 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-orange-400 hover:text-orange-600 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            ) : (
              <>
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-xs">Add Photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      <p className="text-xs text-gray-500 text-center">
        Add up to 6 photos. First photo will be your main profile picture. Max 10MB per image.
      </p>
    </div>
  )
}

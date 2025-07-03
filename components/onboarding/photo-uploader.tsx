"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface PhotoUploaderProps {
  photos: string[]
  onChange: (photos: string[]) => void
  maxPhotos: number
}

export default function PhotoUploader({ photos, onChange, maxPhotos }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)

      if (photos.length + newFiles.length > maxPhotos) {
        alert(`You can upload a maximum of ${maxPhotos} photos`)
        return
      }

      setUploading(true)

      try {
        // In a real app, you would upload to storage here
        // For this demo, we'll just create object URLs
        const newUrls = newFiles.map((file) => URL.createObjectURL(file))
        onChange([...photos, ...newUrls])
      } catch (error) {
        console.error("Error uploading photos:", error)
      } finally {
        setUploading(false)
      }
    }
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...photos]
    newPhotos.splice(index, 1)
    onChange(newPhotos)
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((url, index) => (
          <div key={index} className="relative aspect-square bg-muted rounded-md overflow-hidden">
            <Image src={url || "/placeholder.svg"} alt={`Photo ${index + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemovePhoto(index)}
              className="absolute top-1 right-1 bg-background/80 p-1 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-input rounded-md cursor-pointer hover:bg-muted/50">
            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Upload"}</span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              multiple
              disabled={uploading}
            />
          </label>
        )}
      </div>
    </div>
  )
}

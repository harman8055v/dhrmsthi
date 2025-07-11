"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import imageCompression from "browser-image-compression"
import { supabase } from "@/lib/supabase"

interface PhotoUploaderProps {
  photos: string[]
  onChange: (photos: string[]) => void
  maxPhotos: number
}

export default function PhotoUploader({ photos, onChange, maxPhotos }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<number>(0)

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)

      if (photos.length + newFiles.length > maxPhotos) {
        alert(`You can upload a maximum of ${maxPhotos} photos`)
        return
      }

      setUploading(true)
      setProgress(0)

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) {
          alert("You must be logged in to upload photos.")
          setUploading(false)
          return
        }

        const uploadedUrls: string[] = []
        for (let i = 0; i < newFiles.length; i++) {
          const file = newFiles[i]
          const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true }
          const compressed = await imageCompression(file, options)

          const fileExt = file.name.split('.').pop() ?? 'jpg'
          const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
          const { error: uploadError } = await supabase.storage
            .from("user-photos")
            .upload(filePath, compressed, {
              cacheControl: "3600",
              contentType: compressed.type,
              upsert: false,
            })
          if (uploadError) {
            alert("Failed to upload photo: " + uploadError.message)
          } else {
            const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${filePath}`
            uploadedUrls.push(publicUrl)
          }
          // Update progress
          setProgress(Math.round(((i + 1) / newFiles.length) * 100))
        }
        if (uploadedUrls.length > 0) {
          onChange([...photos, ...uploadedUrls])
        }
      } catch (error) {
        alert("Error uploading photos. Please try again.")
        console.error("Error uploading photos:", error)
      } finally {
        setUploading(false)
        setTimeout(() => setProgress(0), 500)
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
      {uploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-72">
            <p className="text-sm font-medium mb-4">Uploading Photos...</p>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-2 transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-right">{progress}%</p>
          </div>
        </div>
      )}
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

"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { userService } from "@/lib/data-service"
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface ProfileImageUploaderProps {
  currentImages: string[]
  onImagesUpdate: (images: string[]) => void
}

// Helper to extract storage path from URL or return as-is if already a path
function getStoragePath(imageUrl: string) {
  if (!imageUrl) return imageUrl;
  if (!imageUrl.startsWith("http")) return imageUrl;
  // Extract after /user-photos/
  const match = imageUrl.match(/user-photos\/([^?]+)/);
  return match ? decodeURIComponent(match[1]) : imageUrl;
}

export default function ProfileImageUploader({ currentImages, onImagesUpdate }: ProfileImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [editIndex, setEditIndex] = useState<number | null>(null)

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)
      // Get authenticated user ID (auth.uid())
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        toast.error("User not authenticated. Please log in again.")
        setUploading(false)
        return
      }

      const fileExt = file.name.split('.').pop() ?? 'jpg'
      const filePath = `${user.id}/${Date.now()}.${fileExt}`
      console.log("[Upload] Path prepared:", filePath)

      // Attempt upload (no upsert first)
      let { data, error } = await supabase.storage
        .from("user-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        })

      // If conflict (duplicate), retry with upsert
      if ((error as any)?.status === 409) {
        console.warn("[Upload] Duplicate path, retrying with upsert:true")
        ;({ data, error } = await supabase.storage
          .from("user-photos")
          .upload(filePath, file, {
            cacheControl: "3600",
            contentType: file.type,
            upsert: true,
          }))
      }

      console.log("[Upload response]", { data, error })

      if (error) {
        toast.error(error.message || "Failed to upload image.")
        setUploading(false)
        return
      }
      // Save the storage path in DB
      const newImages = [...currentImages, filePath]
      await userService.updateProfile({ user_photos: newImages })
      onImagesUpdate(newImages)
      toast.success("Image uploaded successfully!")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (imagePath: string) => {
    try {
      // Always use the storage path, not full URL
      const storagePath = getStoragePath(imagePath)
      // Fetch auth user again for safety
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        toast.error("User not authenticated. Please log in again.")
        return
      }

      console.log("[Delete] Path:", storagePath)

      if (!storagePath.startsWith(user.id)) {
        toast.warning("Cannot delete a file not owned by the current user.")
        return
      }

      const { data: delData, error: storageError } = await supabase.storage
        .from("user-photos")
        .remove([storagePath])

      console.log("[Delete response]", { delData, storageError })

      if (storageError) {
        toast.error(storageError.message || "Failed to delete image from storage.")
        return
      }
      // Remove from user_photos array
      const newImages = currentImages.filter((img) => img !== imagePath)
      await userService.updateProfile({ user_photos: newImages })
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

  const handleEditPhoto = (index: number) => {
    const imageUrl = currentImages[index]
    setEditIndex(index)
    setImageUrl(imageUrl.startsWith('http') ? imageUrl : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${imageUrl}`)
    setCropModalOpen(true)
  }

  const handleCropSave = async () => {
    if (!imageUrl || !croppedAreaPixels) return
    setUploading(true)
    const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels)
    if (croppedBlob) {
      const croppedFile = new File([croppedBlob], selectedFile?.name || 'cropped.jpg', { type: 'image/jpeg' })
      if (editIndex !== null) {
        // Replace the photo at editIndex
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) {
          toast.error("User not authenticated. Please log in again.")
          setUploading(false)
          return
        }
        const fileExt = croppedFile.name.split('.').pop() ?? 'jpg'
        const filePath = `${user.id}/${Date.now()}.${fileExt}`
        let { error } = await supabase.storage
          .from("user-photos")
          .upload(filePath, croppedFile, {
            cacheControl: "3600",
            contentType: croppedFile.type,
            upsert: false,
          })
        if ((error as any)?.status === 409) {
          ;({ error } = await supabase.storage
            .from("user-photos")
            .upload(filePath, croppedFile, {
              cacheControl: "3600",
              contentType: croppedFile.type,
              upsert: true,
            }))
        }
        if (error) {
          toast.error(error.message || "Failed to upload image.")
          setUploading(false)
          return
        }
        // Update the user_photos array
        const newImages = [...currentImages]
        newImages[editIndex] = filePath
        await userService.updateProfile({ user_photos: newImages })
        onImagesUpdate(newImages)
      } else {
        await uploadImage(croppedFile)
      }
    }
    setUploading(false)
    setCropModalOpen(false)
    setSelectedFile(null)
    setImageUrl(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setEditIndex(null)
  }

  return (
    <div className="space-y-4">
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
      <div className="grid grid-cols-3 gap-4">
        {currentImages.map((imageUrl, index) => (
          <div key={index} className="relative group">
            <img
              src={imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${imageUrl}`) : "/placeholder.svg"}
              alt={`Profile ${index + 1}`}
              className="w-full h-36 object-cover rounded-lg border-2 border-gray-200"
              style={{ objectPosition: '50% 20%' }}
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
            <Button
              size="sm"
              variant="outline"
              className="absolute -top-2 left-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleEditPhoto(index)}
              title="Edit photo"
            >
              <Camera className="w-3 h-3" />
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

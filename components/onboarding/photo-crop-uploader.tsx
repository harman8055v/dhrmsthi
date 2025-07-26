import { useState, useRef } from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import imageCompression from "browser-image-compression"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Button } from '@/components/ui/button';

interface PhotoCropUploaderProps {
  photos: string[]
  onChange: (urls: string[]) => void
  maxPhotos: number
}

export default function PhotoCropUploader({ photos, onChange, maxPhotos }: PhotoCropUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [cropUploadProgress, setCropUploadProgress] = useState<number>(0)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (photos.length >= maxPhotos) {
        alert(`You can upload a maximum of ${maxPhotos} photos`)
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("Image size should be less than 10MB")
        return
      }
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file")
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

  const uploadImage = async (file: File) => {
    try {
      setUploading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        alert("User not authenticated. Please log in again.")
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
        alert(error.message || "Failed to upload image.")
        setUploading(false)
        return null
      }
      return filePath
    } catch (error) {
      alert("Failed to upload image. Please try again.")
      return null
    } finally {
      setUploading(false)
    }
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
          const updated = [...photos, publicUrl]
          onChange(updated)
        }
      }
      setCropUploadProgress(100)
    } catch (error) {
      alert("Failed to upload cropped image. Please try again.")
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
      }, 400)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">Upload Photos (Max {maxPhotos})</label>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {photos.map((url, index) => (
          <div key={`uploaded-${index}`} className="relative aspect-square bg-muted rounded-md overflow-hidden">
            <Image src={url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${url}`} alt={`User photo ${index + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => onChange(photos.filter((img, i) => i !== index))}
              className="absolute top-1 right-1 bg-background/80 p-1 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={() => document.getElementById('settings-photo-input')?.click()}
            disabled={uploading}
            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-input rounded-md cursor-pointer hover:bg-muted/50"
          >
            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Upload"}</span>
          </button>
        )}
      </div>
      <input id="settings-photo-input" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      <p className="text-xs text-gray-500 text-center">Add up to {maxPhotos} photos. Max 10MB per image.</p>
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
                onCropComplete={(_c, p) => setCroppedAreaPixels(p)}
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
    </div>
  )
} 
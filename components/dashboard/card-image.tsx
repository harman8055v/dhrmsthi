"use client"

import React from "react"
import { Info } from "lucide-react"
import Image from "next/image"

interface CardImageProps {
  profile: any
  currentImageIndex: number
  onImageNext: () => void
  onImagePrev: () => void
  onInfoClick: () => void
  getImageUrl: (path: string | null) => string
}

const CardImage = React.memo<CardImageProps>(({
  profile,
  currentImageIndex,
  onImageNext,
  onImagePrev,
  onInfoClick,
  getImageUrl
}) => {
  const getCurrentImage = () => {
    if (profile.user_photos && profile.user_photos.length > 0) {
      return profile.user_photos[currentImageIndex]
    }
    return profile.profile_photo_url || null
  }

  return (
    <div className="relative h-full">
      {getCurrentImage() && (
        <Image
          src={getImageUrl(getCurrentImage())}
          alt={`${profile.first_name} ${profile.last_name}`}
          fill
          className="object-cover"
          style={{ objectPosition: '50% 20%' }}
          priority
          sizes="(max-width: 480px) 100vw, 360px"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
        />
      )}

      {/* Compatibility Badge - Top Left */}
      {profile.compatibility && (
        <div className="absolute top-4 left-4 z-20 space-y-2">
          <div className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border ${
            profile.compatibility.total >= 90 ? 'bg-green-100/90 text-green-800 border-green-200' :
            profile.compatibility.total >= 75 ? 'bg-blue-100/90 text-blue-800 border-blue-200' :
            profile.compatibility.total >= 60 ? 'bg-yellow-100/90 text-yellow-800 border-yellow-200' :
            'bg-gray-100/90 text-gray-800 border-gray-200'
          }`}>
            {profile.compatibility.total}% Match
          </div>
          
          {/* Fallback indicator */}
          {profile.is_fallback_match && (
            <div className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100/90 text-purple-700 border border-purple-200 backdrop-blur-sm">
              ✨ Expanded
            </div>
          )}
          
          {/* Profile Quality Score */}
          {profile.profile_score && profile.profile_score !== 5 && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
              profile.profile_score >= 8 ? 'bg-emerald-100/90 text-emerald-800 border-emerald-200' :
              profile.profile_score >= 6 ? 'bg-blue-100/90 text-blue-800 border-blue-200' :
              'bg-amber-100/90 text-amber-800 border-amber-200'
            }`}>
              {profile.profile_score >= 8 ? '⭐' : profile.profile_score >= 6 ? '🔹' : '📝'} {profile.profile_score}/10
            </div>
          )}
        </div>
      )}

      {/* Info Button - Top Right */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onInfoClick()
        }}
        className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200 z-20"
      >
        <Info className="w-5 h-5" />
      </button>

      {/* Image Navigation */}
      {profile.user_photos && profile.user_photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onImagePrev()
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onImageNext()
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
          >
            →
          </button>

          {/* Image Indicators */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            {profile.user_photos.map((_: any, idx: number) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentImageIndex ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    </div>
  )
})

CardImage.displayName = "CardImage"

export default CardImage 
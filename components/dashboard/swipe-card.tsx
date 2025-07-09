"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion"
import {
  Heart,
  X,
  MapPin,
  Briefcase,
  Calendar,
  GraduationCap,
  Sparkles,
  Star,
  Info,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  User,
  Users,
  MessageCircle,
  Ruler,
  Activity,
  Palette,
  Lock,
  Crown,
  Search,
  Brain,
  BarChart3,
  Zap,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

interface SwipeCardProps {
  profile: any & {
    compatibility?: {
      total: number
      breakdown: {
        spiritual: number
        lifestyle: number
        psychological: number
        demographic: number
        preference: number
        semantic: number
        growth_potential: number
      }
      reasons: string[]
      concerns: string[]
      unique_strengths: string[]
    }
    match_rank?: number
  }
  onSwipe: (direction: "left" | "right" | "superlike", profileId: string) => void
  onUndo: () => void
  showUndo?: boolean
  isTop: boolean
  index: number
}

export default function SwipeCard({ profile, onSwipe, onUndo, showUndo = false, isTop, index }: SwipeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentDetailImageIndex, setCurrentDetailImageIndex] = useState(0)
  const [animatingButton, setAnimatingButton] = useState<string | null>(null)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const { profile: userProfile } = useAuth()
  const cardRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateRaw = useTransform(x, [-300, 300], [-30, 30])
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0])

  const rotate = rotateRaw

  // Get user's subscription plan
  const getUserPlan = () => {
    const accountStatus = userProfile?.account_status
    if (!accountStatus || accountStatus === 'free') return 'drishti'
    
    // For now, we'll need to determine the specific plan from other indicators
    // This could be improved by adding a separate 'current_plan' field
    if (accountStatus === 'elite') return 'samarpan' // Elite users get full access
    if (accountStatus === 'premium') {
      // Check if it's a specific premium plan based on additional indicators
      // For now, default premium users to sangam (basic AI access)
      return 'sangam'
    }
    
    return 'drishti'
  }

  // Check what AI features user has access to
  const getAIAccess = () => {
    const plan = getUserPlan()
    switch (plan) {
      case 'samarpan':
        return { basic: true, advanced: true }
      case 'sangam':
        return { basic: true, advanced: false }
      case 'drishti':
      default:
        return { basic: false, advanced: false }
    }
  }

  const aiAccess = getAIAccess()

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return "N/A"
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    const threshold = 150
    const velocity = info.velocity.x

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      const direction = info.offset.x > 0 ? "right" : "left"
      onSwipe(direction, profile.id)
    }
  }

  const [swipeAnimation, setSwipeAnimation] = useState<"left" | "right" | "up" | null>(null)

  const triggerSwipeAnimation = (direction: "left" | "right" | "up") => {
    setSwipeAnimation(direction)
    setTimeout(() => setSwipeAnimation(null), 800)
  }

  const handleLike = () => {
    if (animatingButton) return
    setAnimatingButton("like")
    triggerSwipeAnimation("right")
    onSwipe("right", profile.id)
    setTimeout(() => setAnimatingButton(null), 500)
  }

  const handleDislike = () => {
    if (animatingButton) return
    setAnimatingButton("dislike")
    triggerSwipeAnimation("left")
    onSwipe("left", profile.id)
    setTimeout(() => setAnimatingButton(null), 500)
  }

  const handleSuperlike = () => {
    if (animatingButton) return
    setAnimatingButton("superlike")
    triggerSwipeAnimation("up")
    onSwipe("superlike", profile.id)
    setTimeout(() => setAnimatingButton(null), 500)
  }

  const handleUndoClick = () => {
    if (animatingButton) return
    setAnimatingButton("undo")
    onUndo()
    setTimeout(() => setAnimatingButton(null), 300)
  }

  const nextImage = () => {
    if (profile.user_photos && profile.user_photos.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % profile.user_photos.length)
    }
  }

  const prevImage = () => {
    if (profile.user_photos && profile.user_photos.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + profile.user_photos.length) % profile.user_photos.length)
    }
  }

  const nextDetailImage = () => {
    if (profile.user_photos && profile.user_photos.length > 1) {
      setCurrentDetailImageIndex((prev) => (prev + 1) % profile.user_photos.length)
    }
  }

  const prevDetailImage = () => {
    if (profile.user_photos && profile.user_photos.length > 1) {
      setCurrentDetailImageIndex((prev) => (prev - 1 + profile.user_photos.length) % profile.user_photos.length)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        prevDetailImage()
      } else {
        nextDetailImage()
      }
    }
    setTouchStartX(null)
  }

  const getCurrentImage = () => {
    if (profile.user_photos && profile.user_photos.length > 0) {
      return profile.user_photos[currentImageIndex]
    }
    return profile.profile_photo_url || null
  }

  const getCurrentDetailImage = () => {
    if (profile.user_photos && profile.user_photos.length > 0) {
      return profile.user_photos[currentDetailImageIndex]
    }
    return null
  }

  // Helper function to get proper image URL
  const getImageUrl = (imagePath: string | null): string => {
    if (!imagePath) return "/placeholder.svg";
    return imagePath.startsWith('http') 
      ? imagePath 
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${imagePath}`;
  };

  const nopeOpacity = useTransform(x, [-150, -50], [1, 0])
  const nopeRotate = useTransform(x, [-150, -50], [-30, 0])
  const likeOpacity = useTransform(x, [50, 150], [0, 1])
  const likeRotate = useTransform(x, [50, 150], [0, 30])

  if (!isTop && !isExpanded) {
    return (
      <motion.div
        className="absolute inset-0 bg-white rounded-3xl shadow-lg border border-gray-200"
        style={{
          scale: 1 - index * 0.05,
          y: index * 10,
          zIndex: 10 - index,
        }}
        initial={{ scale: 1 - index * 0.05, y: index * 10 }}
        animate={{ scale: 1 - index * 0.05, y: index * 10 }}
      >
        <div className="relative w-full h-full rounded-3xl overflow-hidden">
          {getCurrentImage() && (
            <Image
              src={getImageUrl(getCurrentImage())}
              alt={`${profile.first_name} ${profile.last_name}`}
              fill
              className="object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <motion.div
        ref={cardRef}
        className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden cursor-pointer"
        style={{
          x,
          y: isExpanded ? y : 0,
          rotate,
          opacity,
          zIndex: isTop ? 20 : 10 - index,
        }}
        drag={false}
        whileTap={{ scale: isExpanded ? 1 : 0.95 }}
        layout
        onClick={() => setIsExpanded(true)}
      >
        {/* Main Card Content */}
        <div className="relative w-full h-full">
          {/* Image Section */}
          <div className="relative h-full">
            {getCurrentImage() && (
              <Image
                src={getImageUrl(getCurrentImage())}
                alt={`${profile.first_name} ${profile.last_name}`}
                fill
                className="object-cover"
                priority
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
            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(true)
              }}
              className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-colors z-20"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Info className="w-5 h-5" />
            </motion.button>

            {/* Image Navigation */}
            {profile.user_photos && profile.user_photos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors z-10"
                >
                  ←
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
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

            {/* Profile Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <div className="flex items-end justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">
                    {profile.first_name} {profile.last_name}
                  </h2>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{calculateAge(profile.birthdate)} years old</span>
                    </div>

                    {profile.city?.name && profile.state?.name && (
                      <div className="flex items-center gap-1 text-white/90 text-sm">
                        <MapPin className="w-3 h-3" />
                        {profile.city.name}, {profile.state.name}
                      </div>
                    )}

                    {profile.profession && (
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <Briefcase className="w-4 h-4" />
                        <span>{profile.profession}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Info Tags */}
                  <div className="flex flex-wrap gap-2">
                    {profile.spiritual_org &&
                      Array.isArray(profile.spiritual_org) &&
                      profile.spiritual_org.length > 0 &&
                      profile.spiritual_org.slice(0, 2).map((org: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-white/20 rounded-full text-xs backdrop-blur-sm">
                          {org}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>


          </div>

          {/* Enhanced Swipe Indicators */}
          <motion.div
            className="absolute top-1/2 left-8 transform -translate-y-1/2 px-6 py-3 bg-red-500 text-white rounded-2xl font-bold text-xl shadow-2xl border-4 border-white"
            style={{
              opacity: nopeOpacity,
              rotate: nopeRotate,
            }}
          >
            NOPE
          </motion.div>

          <motion.div
            className="absolute top-1/2 right-8 transform -translate-y-1/2 px-6 py-3 bg-green-500 text-white rounded-2xl font-bold text-xl shadow-2xl border-4 border-white"
            style={{
              opacity: likeOpacity,
              rotate: likeRotate,
            }}
          >
            LIKE
          </motion.div>

          {/* Swipe Animation Overlays */}
          {swipeAnimation && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {swipeAnimation === "right" && (
                <motion.div
                  className="absolute inset-0 bg-green-500/20"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <motion.div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1.5, rotate: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Heart className="w-16 h-16 text-green-500" fill="currentColor" />
                  </motion.div>
                </motion.div>
              )}

              {swipeAnimation === "left" && (
                <motion.div
                  className="absolute inset-0 bg-red-500/20"
                  initial={{ x: "100%" }}
                  animate={{ x: "-100%" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <motion.div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    initial={{ scale: 0, rotate: 45 }}
                    animate={{ scale: 1.5, rotate: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <X className="w-16 h-16 text-red-500" />
                  </motion.div>
                </motion.div>
              )}

              {swipeAnimation === "up" && (
                <motion.div
                  className="absolute inset-0 bg-blue-500/20"
                  initial={{ y: "100%" }}
                  animate={{ y: "-100%" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <motion.div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    initial={{ scale: 0, y: 50 }}
                    animate={{ scale: 2, y: -100 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Star className="w-12 h-12 text-blue-500" fill="currentColor" />
                  </motion.div>

                  {/* Superlike trail effect */}
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute left-1/2 transform -translate-x-1/2"
                      style={{ top: `${60 + i * 15}%` }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.1, duration: 0.3 }}
                    >
                      <Star className="w-6 h-6 text-blue-400" fill="currentColor" />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Expanded Detail View */}
      {isExpanded && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-[100000]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsExpanded(false)}
        >
          <motion.div
            className="w-full h-screen bg-white overflow-y-auto relative"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/20 rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors z-30"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="pb-32">
              {/* Optimized Swipeable Photo Gallery */}
              {profile.user_photos && profile.user_photos.length > 0 && (
                <div
                  className="relative h-[50vh] bg-gray-100 overflow-hidden"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <div
                    className="flex h-full transition-transform duration-300 ease-out"
                    style={{
                      transform: `translateX(-${currentDetailImageIndex * 100}%)`,
                    }}
                  >
                    {profile.user_photos.map((photo: string, idx: number) => (
                      <div key={idx} className="w-full h-full relative flex-shrink-0">
                        {photo && (
                          <Image
                            src={getImageUrl(photo)}
                            alt={`${profile.first_name} ${profile.last_name} - Photo ${idx + 1}`}
                            fill
                            className="object-cover"
                            priority={idx === 0}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Touch/Swipe Areas for Navigation */}
                  <div className="absolute inset-0 flex">
                    <button
                      onClick={prevDetailImage}
                      disabled={currentDetailImageIndex === 0}
                      className="flex-1 opacity-0 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={nextDetailImage}
                      disabled={currentDetailImageIndex === profile.user_photos.length - 1}
                      className="flex-1 opacity-0 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Better Photo Navigation Arrows */}
                  {profile.user_photos.length > 1 && (
                    <>
                      <motion.button
                        onClick={prevDetailImage}
                        disabled={currentDetailImageIndex === 0}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white shadow-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed z-20"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ChevronLeft className="w-7 h-7" />
                      </motion.button>
                      <motion.button
                        onClick={nextDetailImage}
                        disabled={currentDetailImageIndex === profile.user_photos.length - 1}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white shadow-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed z-20"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ChevronRight className="w-7 h-7" />
                      </motion.button>
                    </>
                  )}

                  {/* Photo Navigation Dots */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
                    {profile.user_photos.map((_: any, idx: number) => (
                      <motion.button
                        key={idx}
                        onClick={() => setCurrentDetailImageIndex(idx)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          idx === currentDetailImageIndex ? "bg-white scale-125" : "bg-white/60"
                        }`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="p-6 space-y-8">
                {/* Profile Header */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-orange-100">
                    {getCurrentImage() && (
                      <Image
                        src={getImageUrl(getCurrentImage())}
                        alt={`${profile.first_name} ${profile.last_name}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-gray-900 mb-1">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <p className="text-lg text-gray-600 mb-2">{calculateAge(profile.birthdate)} years old</p>
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {profile.city?.name}, {profile.state?.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Favorite Quote Section */}
                {profile.favorite_quote && (
                  <div className="bg-gradient-to-r from-orange-50 to-pink-50 rounded-2xl p-6 border border-orange-100">
                    <div className="text-center">
                      <div className="text-4xl text-orange-400 mb-3">❝</div>
                      <blockquote className="text-lg text-gray-800 font-medium italic leading-relaxed mb-3">
                        {profile.favorite_quote}
                      </blockquote>
                      {profile.quote_author && (
                        <cite className="text-sm text-gray-600 font-medium">— {profile.quote_author}</cite>
                      )}
                    </div>
                  </div>
                )}

                {/* About Section */}
                {profile.about_me && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-orange-500" />
                      About Me
                    </h4>
                    <p className="text-gray-700 leading-relaxed text-base">{profile.about_me}</p>
                  </div>
                )}

                {/* AI Compatibility Analysis Section */}
                {profile.compatibility && (
                  <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-2xl p-6 shadow-sm border border-purple-100">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">AI</span>
                        </div>
                        {aiAccess.basic ? 'Compatibility Analysis' : 'AI Matching Analysis'}
                      </h4>
                      <div className="flex items-center gap-2">
                        {aiAccess.basic ? (
                          <>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                              profile.compatibility.total >= 90 ? 'bg-green-100 text-green-800' :
                              profile.compatibility.total >= 75 ? 'bg-blue-100 text-blue-800' :
                              profile.compatibility.total >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {profile.compatibility.total}% Match
                            </div>
                            {profile.match_rank && (
                              <div className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                #{profile.match_rank}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Locked
                          </div>
                        )}
                      </div>
                    </div>

                    {aiAccess.basic ? (
                      <>
                        {/* Full AI Analysis for Sangam and Samarpan users */}
                        
                        {/* Compatibility Breakdown */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          {Object.entries(profile.compatibility.breakdown).map(([category, score]) => {
                            const numericScore = Number(score)
                            const categoryLabels: Record<string, { name: string; icon: string; color: string }> = {
                              spiritual: { name: 'Spiritual', icon: '🕉️', color: 'purple' },
                              lifestyle: { name: 'Lifestyle', icon: '🌱', color: 'green' },
                              psychological: { name: 'Mindset', icon: '🧠', color: 'blue' },
                              demographic: { name: 'Demographics', icon: '📍', color: 'orange' },
                              preference: { name: 'Preferences', icon: '💕', color: 'pink' },
                              semantic: { name: 'Communication', icon: '💬', color: 'indigo' },
                              growth_potential: { name: 'Growth', icon: '🌟', color: 'yellow' }
                            }
                            
                            const categoryData = categoryLabels[category]
                            if (!categoryData) return null
                            
                            return (
                              <div key={category} className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{categoryData.icon}</span>
                                    <span className="text-sm font-medium text-gray-700">{categoryData.name}</span>
                                  </div>
                                  <span className="text-sm font-bold text-gray-900">{numericScore}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full bg-gradient-to-r ${
                                      categoryData.color === 'purple' ? 'from-purple-400 to-purple-600' :
                                      categoryData.color === 'green' ? 'from-green-400 to-green-600' :
                                      categoryData.color === 'blue' ? 'from-blue-400 to-blue-600' :
                                      categoryData.color === 'orange' ? 'from-orange-400 to-orange-600' :
                                      categoryData.color === 'pink' ? 'from-pink-400 to-pink-600' :
                                      categoryData.color === 'indigo' ? 'from-indigo-400 to-indigo-600' :
                                      'from-yellow-400 to-yellow-600'
                                    }`}
                                    style={{ width: `${numericScore}%` }}
                                  ></div>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Why This Match Works */}
                        {profile.compatibility.reasons.length > 0 && (
                          <div className="mb-6">
                            <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              ✨ Why This Match Works
                            </h5>
                            <div className="space-y-2">
                              {profile.compatibility.reasons.slice(0, 4).map((reason: string, index: number) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-white/60 rounded-lg">
                                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-green-600 text-sm">✓</span>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed">{reason}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Unique Strengths */}
                        {profile.compatibility.unique_strengths.length > 0 && (
                          <div className="mb-6">
                            <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              💎 Unique Match Strengths
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {profile.compatibility.unique_strengths.map((strength: string, index: number) => (
                                <span 
                                  key={index} 
                                  className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-sm font-medium border border-purple-200"
                                >
                                  {strength}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Advanced AI Insights - Only for Samarpan users */}
                        {aiAccess.advanced ? (
                          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200 mb-6">
                            <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <Brain className="w-5 h-5 text-indigo-600" />
                              Advanced AI Insights
                              <div className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                                Premium
                              </div>
                            </h5>
                            <div className="space-y-3">
                              <div className="bg-white/70 rounded-lg p-3">
                                <h6 className="font-medium text-indigo-900 mb-2 flex items-center gap-2">
                                  <BarChart3 className="w-4 h-4" />
                                  Long-term Compatibility Score
                                </h6>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-700">Future relationship potential</span>
                                  <span className="font-bold text-indigo-600">{Math.min(profile.compatibility.total + 5, 99)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                  <div 
                                    className="h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500"
                                    style={{ width: `${Math.min(profile.compatibility.total + 5, 99)}%` }}
                                  ></div>
                                </div>
                              </div>
                              
                              <div className="bg-white/70 rounded-lg p-3">
                                <h6 className="font-medium text-indigo-900 mb-2 flex items-center gap-2">
                                  <Zap className="w-4 h-4" />
                                  AI Conversation Starters
                                </h6>
                                <div className="text-sm text-gray-700 space-y-1">
                                  <p>• "I noticed we both practice meditation - what's your favorite technique?"</p>
                                  <p>• "Your spiritual journey resonates with mine. What drew you to spirituality?"</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Advanced AI Locked for Sangam users */
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 mb-6 relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <Crown className="w-6 h-6 text-white" />
                                </div>
                                <h6 className="font-semibold text-gray-900 mb-2">Advanced AI Insights</h6>
                                <p className="text-sm text-gray-600 mb-3">Go deeper with Advanced AI Matching</p>
                                <Button 
                                  size="sm" 
                                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                                  onClick={() => window.location.href = '/dashboard/store'}
                                >
                                  Upgrade to Samarpan
                                </Button>
                              </div>
                            </div>
                            <div className="opacity-30">
                              <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Brain className="w-5 h-5 text-indigo-600" />
                                Advanced AI Insights
                              </h5>
                              <div className="space-y-3">
                                <div className="bg-white/70 rounded-lg p-3">
                                  <h6 className="font-medium text-indigo-900 mb-2">Long-term Compatibility</h6>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 w-4/5"></div>
                                  </div>
                                </div>
                                <div className="bg-white/70 rounded-lg p-3">
                                  <h6 className="font-medium text-indigo-900 mb-2">AI Conversation Starters</h6>
                                  <div className="text-sm text-gray-700">
                                    <p>• Personalized conversation suggestions</p>
                                    <p>• Deep psychological insights</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Considerations */}
                        {profile.compatibility.concerns.length > 0 && (
                          <div>
                            <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              🤔 Things to Consider
                            </h5>
                            <div className="space-y-2">
                              {profile.compatibility.concerns.slice(0, 2).map((concern: string, index: number) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-yellow-600 text-sm">!</span>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed">{concern}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      /* Locked AI Analysis for Drishti and Sparsh users */
                      <div className="relative">
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                          <div className="text-center p-6">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Search className="w-8 h-8 text-white" />
                            </div>
                            <h5 className="text-lg font-semibold text-gray-900 mb-2">Unlock AI Match Analysis</h5>
                            <p className="text-sm text-gray-600 mb-4 max-w-sm">
                              Discover personalized compatibility insights with the Sangam Plan
                            </p>
                            <div className="space-y-2">
                              <Button 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                onClick={() => window.location.href = '/dashboard/store'}
                              >
                                Upgrade Now
                              </Button>
                              <div className="text-xs text-gray-500">
                                Starting from ₹499/month
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="opacity-20 pointer-events-none">
                          {/* Blurred preview of AI analysis */}
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="bg-white/70 backdrop-blur-sm rounded-xl p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-gray-300 rounded"></div>
                                    <div className="w-16 h-3 bg-gray-300 rounded"></div>
                                  </div>
                                  <div className="w-8 h-3 bg-gray-300 rounded"></div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div className="h-2 rounded-full bg-gray-300 w-3/4"></div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="space-y-3">
                            <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
                            <div className="w-full h-3 bg-gray-300 rounded"></div>
                            <div className="w-2/3 h-3 bg-gray-300 rounded"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Essential Details Grid */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-500" />
                    Essential Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.profession && (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-blue-600 font-medium">Profession</p>
                          <p className="font-semibold text-gray-900">{profile.profession}</p>
                        </div>
                      </div>
                    )}

                    {profile.education && (
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                        <GraduationCap className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm text-green-600 font-medium">Education</p>
                          <p className="font-semibold text-gray-900">{profile.education}</p>
                        </div>
                      </div>
                    )}

                    {profile.diet && (
                      <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-sm text-purple-600 font-medium">Diet</p>
                          <p className="font-semibold text-gray-900">{profile.diet}</p>
                        </div>
                      </div>
                    )}

                    {profile.mother_tongue && (
                      <div className="flex items-center gap-3 p-4 bg-pink-50 rounded-xl">
                        <MessageCircle className="w-5 h-5 text-pink-600" />
                        <div>
                          <p className="text-sm text-pink-600 font-medium">Mother Tongue</p>
                          <p className="font-semibold text-gray-900">{profile.mother_tongue}</p>
                        </div>
                      </div>
                    )}

                    {/* Height */}
                    {profile.height_ft && profile.height_in && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Ruler className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-indigo-600 font-medium">Height</p>
                          <p className="font-semibold text-gray-900">{profile.height_ft}' {profile.height_in}"</p>
                        </div>
                      </div>
                    )}

                    {profile.marital_status && (
                      <div className="flex items-center gap-3 p-4 bg-rose-50 rounded-xl">
                        <Heart className="w-5 h-5 text-rose-600" />
                        <div>
                          <p className="text-sm text-rose-600 font-medium">Marital Status</p>
                          <p className="font-semibold text-gray-900">{profile.marital_status}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Spiritual Journey */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-orange-500" />
                    Spiritual Journey
                  </h4>

                  {/* Daily Practices */}
                  {profile.daily_practices && Array.isArray(profile.daily_practices) && profile.daily_practices.length > 0 && (
                    <div className="mb-6">
                      <h5 className="text-lg font-semibold text-gray-800 mb-3">Daily Practices</h5>
                      <div className="flex flex-wrap gap-2">
                        {profile.daily_practices.map((practice: string, index: number) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-medium border border-orange-200"
                          >
                            {practice}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spiritual Organizations */}
                  {profile.spiritual_org && Array.isArray(profile.spiritual_org) && profile.spiritual_org.length > 0 && (
                    <div className="mb-6">
                      <h5 className="text-lg font-semibold text-gray-800 mb-3">Spiritual Organizations</h5>
                      <div className="flex flex-wrap gap-2">
                        {profile.spiritual_org.map((org: string, index: number) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium border border-purple-200"
                          >
                            {org}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Partner Preferences */}
                {profile.ideal_partner_notes && (
                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-200">
                    <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-rose-500" />
                      Looking For
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{profile.ideal_partner_notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Close Button - Only close action in expanded view */}
            <div className="fixed bottom-6 right-6 z-30">
              <motion.button
                onClick={() => setIsExpanded(false)}
                className="w-14 h-14 bg-white shadow-xl rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors border border-gray-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-7 h-7" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}

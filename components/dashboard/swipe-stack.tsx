"use client"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Heart, X, Star, RotateCcw, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { isUserVerified } from "@/lib/utils"
import Image from "next/image"
import { useRouter } from "next/navigation"
import ProfileModal from "@/components/profile-modal"

interface SwipeStackProps {
  profiles: any[]
  onSwipe: (direction: "left" | "right" | "superlike", profileId: string) => void
  headerless?: boolean
  userProfile?: any
}

export default function SwipeStack({ profiles: initialProfiles, onSwipe, headerless = false, userProfile }: SwipeStackProps) {
  const router = useRouter()
  const [profiles, setProfiles] = useState(initialProfiles)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeStats, setSwipeStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [undoStack, setUndoStack] = useState<any[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  // REMOVED: triggerSwipe state - we'll handle swipes directly
  const [exitingCard, setExitingCard] = useState<{ id: string, direction: "left" | "right" | "superlike" } | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  // Check if user is verified
  const isVerified = userProfile ? isUserVerified(userProfile) : false

  if (!isVerified) {
    return (
      <div className="flex items-center justify-center px-4 h-full">
        <div className="text-center max-w-md">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Verification Required</h3>
          <p className="text-gray-600">
            Your profile is currently under review. Once verified, you'll be able to discover matches.
          </p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (retryCount = 0) => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchSwipeStats(), fetchProfiles()])
    } catch (err) {
      console.error(`SwipeStack: Error in fetchData (attempt ${retryCount + 1}):`, err)
      
      // Retry once for network-related errors
      if (retryCount === 0 && err instanceof Error && 
          (err.message.includes('Network error') || err.message.includes('timed out'))) {
        console.log("SwipeStack: Retrying after network error...")
        setTimeout(() => fetchData(1), 2000) // Retry after 2 seconds
        return
      }
      
      const errorMessage = err instanceof Error ? err.message : "Failed to load profiles. Please try again."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchSwipeStats = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch("/api/swipe/stats", {
        credentials: "include",
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to fetch swipe stats: HTTP ${response.status}`
        throw new Error(errorMessage)
      }
      
      const stats = await response.json()
      setSwipeStats(stats)
      console.log("SwipeStack: Fetched swipe stats successfully")
    } catch (error) {
      console.error("SwipeStack: Error in fetchSwipeStats:", error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error("Swipe stats request timed out. Please try again.")
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error("Network error loading swipe stats. Please check your internet connection.")
        }
      }
      
      throw error
    }
  }

  const fetchProfiles = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
      
      const response = await fetch("/api/profiles/discover", {
        credentials: "include",
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `HTTP ${response.status}: Failed to fetch profiles`
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      
      if (!data.profiles) {
        throw new Error("No profile data received from server")
      }
      
      const profilesWithPhotos = data.profiles.filter((profile: any) => 
        profile.user_photos && Array.isArray(profile.user_photos) && profile.user_photos.length > 0
      )
      
      console.log(`SwipeStack: Fetched ${profilesWithPhotos.length} profiles with photos`)
      
      // NEW: Append new profiles instead of replacing to maintain continuity
      setProfiles(prev => {
        // Get IDs of existing profiles to avoid duplicates
        const existingIds = new Set(prev.map(p => p.id))
        const newProfiles = profilesWithPhotos.filter((p: any) => !existingIds.has(p.id))
        console.log(`SwipeStack: Adding ${newProfiles.length} new profiles (${existingIds.size} existing)`)
        return [...prev, ...newProfiles]
      })
      
      if (data.fallback_used && data.profiles?.length > 0) {
        toast.info("✨ We've expanded your search to show more spiritual partners!", {
          duration: 4000,
        })
      }
    } catch (error) {
      console.error("SwipeStack: Error in fetchProfiles:", error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error("Request timed out. Please check your connection and try again.")
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error("Network error. Please check your internet connection.")
        }
      }
      
      throw error
    }
  }

  const handleViewProfile = (profile: any) => {
    setSelectedProfile(profile)
    setProfileModalOpen(true)
  }

  const handleSwipe = async (direction: "left" | "right" | "superlike", profileId: string) => {
    // Prevent swipe if card is already animating
    if (exitingCard) {
      return
    }
    
    // Prevent swipe if we're at the end
    if (currentIndex >= profiles.length) {
      return
    }

    // Check limits
    if (!swipeStats?.can_swipe) {
      toast.error("Daily swipe limit reached!", {
        description: `You've used ${swipeStats?.swipes_used || 0}/${swipeStats?.daily_limit || 5} daily swipes on your ${swipeStats?.plan || 'current'} plan.`,
        action: {
          label: "Upgrade Plan",
          onClick: () => router.push("/dashboard/store"),
        },
        duration: 8000,
      })
      return
    }

    if (direction === "superlike" && (!swipeStats?.super_likes_available || swipeStats?.super_likes_available <= 0)) {
      toast.error("No Super Likes available!", {
        description: "Purchase Super Likes to stand out from the crowd",
        action: {
          label: "Go to Store",
          onClick: () => router.push("/dashboard/store"),
        },
        duration: 5000,
      })
      return
    }

    // Set exiting card to trigger animation
    setExitingCard({ id: profileId, direction })

    // Wait for animation to complete before updating state
    const animationDuration = direction === "superlike" ? 700 : 400
    
    setTimeout(() => {
      // Update UI state after animation
      const swipedProfile = profiles[currentIndex]
      setUndoStack(prev => [...prev, { profile: swipedProfile, direction, index: currentIndex }])
      setCurrentIndex(prev => prev + 1)
      setCurrentImageIndex(0)
      setExitingCard(null)

      // Update stats optimistically
      if (swipeStats) {
        setSwipeStats({
          ...swipeStats,
          swipes_remaining: swipeStats.swipes_remaining - 1,
          super_likes_available: direction === "superlike" 
            ? swipeStats.super_likes_available - 1 
            : swipeStats.super_likes_available,
        })
      }
    }, animationDuration)

    try {
      // Send API request in background
      const response = await fetch("/api/swipe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          swiped_user_id: profileId,
          action: direction === "left" ? "dislike" : direction === "right" ? "like" : "superlike",
        }),
      })

      const result = await response.json()

      if (response.ok) {
        // Show match notification
        if (result.is_match) {
          toast.success("🎉 It's a match! You can now message each other.")
        } else if (direction === "superlike") {
          toast.success("⭐ Super Like sent!")
        }

        onSwipe(direction, profileId)

        // Load more profiles if running low
        if (currentIndex + 1 >= profiles.length - 3) {
          fetchProfiles()
        }
      } else {
        // Handle swipe limit reached (429 status)
        if (response.status === 429 && result.limit_reached) {
          toast.error(result.upgrade_message || "Daily swipe limit reached!", {
            description: `You've used ${result.swipes_used}/${result.daily_limit} daily swipes on your ${result.current_plan} plan.`,
            action: {
              label: "Upgrade Plan",
              onClick: () => router.push(result.store_link || "/dashboard/store"),
            },
            duration: 8000,
          })
          return // Don't rollback for limit errors - they're intentional
        }
        
        // Only rollback if it's not a duplicate error and animation has completed
        if (!result.error?.includes("Already swiped")) {
          // Wait for animation to complete before rollback
          setTimeout(() => {
            // Rollback optimistic updates on error
            setCurrentIndex(prev => prev - 1)
            setUndoStack(prev => prev.slice(0, -1))
            
            // Restore stats
            if (swipeStats) {
              setSwipeStats({
                ...swipeStats,
                swipes_remaining: swipeStats.swipes_remaining + 1,
                super_likes_available: direction === "superlike" 
                  ? swipeStats.super_likes_available + 1 
                  : swipeStats.super_likes_available,
              })
            }
          }, animationDuration)
          
          toast.error(result.error || "Failed to swipe")
        }
      }
    } catch (error) {
      // Rollback on network error after animation
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1)
        setUndoStack(prev => prev.slice(0, -1))
        
        // Restore stats
        if (swipeStats) {
          setSwipeStats({
            ...swipeStats,
            swipes_remaining: swipeStats.swipes_remaining + 1,
            super_likes_available: direction === "superlike" 
              ? swipeStats.super_likes_available + 1 
              : swipeStats.super_likes_available,
          })
        }
      }, animationDuration)
      
      toast.error("Something went wrong. Please try again.")
    }
  }

  const handleUndo = async () => {
    if (undoStack.length === 0) return

    const lastAction = undoStack[undoStack.length - 1]
    
    try {
      // Delete the swipe from the database
      const response = await fetch("/api/swipe", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          swiped_user_id: lastAction.profile.id,
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        toast.error(result.error || "Failed to undo swipe")
        return
      }

      // Update UI state
      setUndoStack(prev => prev.slice(0, -1))
      setCurrentIndex(lastAction.index)

      toast.success("Last action undone!")
    } catch (error) {
      toast.error("Failed to undo swipe")
    }
  }

  const getImageUrl = (imagePath: string | null): string => {
    if (!imagePath) return "/placeholder.svg"
    return imagePath.startsWith('http') 
      ? imagePath 
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${imagePath}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b0000]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center px-4 h-full">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Error Loading Profiles</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData} className="bg-[#8b0000] hover:bg-[#6b0000]">Try Again</Button>
        </div>
      </div>
    )
  }

  const hasMoreProfiles = currentIndex < profiles.length

  if (!hasMoreProfiles) {
    return (
      <div className="flex items-center justify-center px-4 h-full">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No More Profiles</h3>
          <p className="text-gray-600 mb-4">Check back later for new matches!</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={fetchProfiles} className="bg-[#8b0000] hover:bg-[#6b0000]">Refresh</Button>
            {undoStack.length > 0 && (
              <Button onClick={handleUndo} variant="outline" className="border-[#8b0000] text-[#8b0000] hover:bg-[#8b0000]/10">
                <RotateCcw className="w-4 h-4 mr-2" />
                Undo
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const currentProfile = profiles[currentIndex] || null
  


  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Compact Header */}
      {!headerless && swipeStats && (
        <div className="flex-shrink-0 h-12 px-4 bg-white flex items-center shadow-sm">
          <div className="flex justify-between items-center w-full">
            <h1 className="text-lg font-bold text-[#8b0000]">Discover</h1>
            <div className="flex items-center gap-1 text-[#8b0000]">
              <Star className="w-4 h-4" fill="currentColor" />
              <span className="font-medium">{swipeStats.super_likes_available}</span>
            </div>
          </div>
        </div>
      )}

      {/* Card Stack Container - Takes all available space */}
      <div className="flex-grow relative overflow-hidden px-4 pb-2">
        <div className="relative h-full w-full max-w-md mx-auto">
          <AnimatePresence>
            {profiles.slice(currentIndex, currentIndex + 3).reverse().map((profile, index) => (
              <SwipeCard
                key={profile.id}
                profile={profile}
                index={2 - index}
                isTop={index === 2}
                onSwipe={handleSwipe}
                onViewProfile={handleViewProfile}
                currentImageIndex={index === 2 ? currentImageIndex : 0}
                setCurrentImageIndex={index === 2 ? setCurrentImageIndex : undefined}
                exitDirection={exitingCard && exitingCard.id === profile.id ? exitingCard.direction : null}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex-shrink-0 h-20 bg-white shadow-lg">
        <div className="h-full flex justify-center items-center gap-3 px-4">
          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50 transition-none hover:bg-gray-200 active:scale-95"
          >
            <RotateCcw className="w-5 h-5 text-gray-600" />
          </button>

          {/* Pass */}
          <button
            onClick={() => {
              const currentProfile = profiles[currentIndex]
              if (!exitingCard && currentProfile) {
                handleSwipe("left", currentProfile.id)
              }
            }}
            disabled={exitingCard !== null || !profiles[currentIndex]}
            className="w-14 h-14 rounded-full bg-white shadow-md border-2 border-gray-200 flex items-center justify-center hover:border-red-300 transition-none active:scale-95 disabled:opacity-50"
          >
            <X className="w-6 h-6 text-red-500" />
          </button>

          {/* Super Like */}
          <button
            onClick={() => {
              const currentProfile = profiles[currentIndex]
              if (!exitingCard && currentProfile) {
                if (!swipeStats?.super_likes_available || swipeStats?.super_likes_available <= 0) {
                  toast.error("No Super Likes available!", {
                    description: "Purchase Super Likes to stand out from the crowd",
                    action: {
                      label: "Go to Store",
                      onClick: () => router.push("/dashboard/store"),
                    },
                    duration: 5000,
                  })
                } else {
                  handleSwipe("superlike", currentProfile.id)
                }
              }
            }}
            disabled={exitingCard !== null || !profiles[currentIndex]}
            className="w-12 h-12 rounded-full bg-[#8b0000] shadow-md flex items-center justify-center hover:bg-[#6b0000] transition-none active:scale-95 disabled:opacity-50"
          >
            <Star className="w-5 h-5 text-white" fill="currentColor" />
          </button>

          {/* Like */}
          <button
            onClick={() => {
              const currentProfile = profiles[currentIndex]
              if (!exitingCard && currentProfile) {
                handleSwipe("right", currentProfile.id)
              }
            }}
            disabled={exitingCard !== null || !profiles[currentIndex]}
            className="w-14 h-14 rounded-full bg-green-500 shadow-md flex items-center justify-center hover:bg-green-600 transition-none active:scale-95 disabled:opacity-50"
          >
            <Heart className="w-6 h-6 text-white" fill="currentColor" />
          </button>
        </div>
      </div>
      
      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
        />
      )}
    </div>
  )
}

// Separate SwipeCard component
function SwipeCard({ 
  profile, 
  index, 
  isTop, 
  onSwipe,
  onViewProfile,
  currentImageIndex = 0, 
  setCurrentImageIndex,
  exitDirection
}: {
  profile: any
  index: number
  isTop: boolean
  onSwipe: (direction: "left" | "right" | "superlike", profileId: string) => void
  onViewProfile?: (profile: any) => void
  currentImageIndex?: number
  setCurrentImageIndex?: (index: number) => void
  exitDirection?: "left" | "right" | "superlike" | null
}) {
  // REMOVED: Local exit state and trigger logic - now controlled by parent
  
  // === NEW: Derived values ===
  // Compute age once to avoid recalculating on every render
  const age = (() => {
    if (profile.age && typeof profile.age === "number") return profile.age
    if (profile.date_of_birth) {
      const a = calculateAge(profile.date_of_birth as string)
      if (a !== "N/A") return a
    }
    if (profile.birthdate) {
      const a = calculateAge(profile.birthdate as string)
      if (a !== "N/A") return a
    }
    return "N/A"
  })()

  // Format spiritual organization – handle arrays or JSON strings gracefully
  const spiritualOrgText = (() => {
    if (!profile.spiritual_org) return null
    // Already an array
    if (Array.isArray(profile.spiritual_org)) {
      return profile.spiritual_org[0] || null // Show only first organization
    }
    // Try JSON.parse in case it's a serialized array
    if (typeof profile.spiritual_org === "string") {
      try {
        const parsed = JSON.parse(profile.spiritual_org)
        if (Array.isArray(parsed)) {
          return parsed[0] || null // Show only first organization
        }
      } catch {
        /* not JSON */
      }
      // Fallback: remove brackets/quotes if present and take first part
      const cleaned = profile.spiritual_org.replace(/^[\[\"]+|[\]\"]+$/g, "")
      // If it's comma separated, take the first one
      return cleaned.split(',')[0].trim() || null
    }
    return String(profile.spiritual_org)
  })()



  const getImageUrl = (imagePath: string | null): string => {
    if (!imagePath) return "/placeholder.svg"
    return imagePath.startsWith('http') 
      ? imagePath 
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${imagePath}`
  }

  function calculateAge(birthdate: string) {
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


  const nextImage = () => {
    if (!setCurrentImageIndex || !profile.user_photos) return
    setCurrentImageIndex((currentImageIndex + 1) % profile.user_photos.length)
  }

  const prevImage = () => {
    if (!setCurrentImageIndex || !profile.user_photos) return
    setCurrentImageIndex((currentImageIndex - 1 + profile.user_photos.length) % profile.user_photos.length)
  }

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        scale: 1 - index * 0.05,
        zIndex: 10 - index,
      }}
      initial={{ scale: 1 - index * 0.05, y: index * 10 }}
      animate={{ 
        scale: exitDirection === "superlike" ? 1.1 : 1 - index * 0.05, 
        y: exitDirection === "superlike" ? -50 : index * 10,
        rotate: exitDirection === "superlike" ? 360 : 0
      }}
      exit={{ 
        x: exitDirection === "right" ? 300 : exitDirection === "left" ? -300 : 0,
        y: exitDirection === "superlike" ? -500 : 0,
        opacity: 0,
        scale: exitDirection === "superlike" ? 1.2 : 1
      }}
      transition={{ 
        type: exitDirection === "superlike" ? "spring" : "tween", 
        duration: exitDirection === "superlike" ? 0.7 : 0.4, 
        ease: "easeOut" 
      }}
          >
        <div className="w-full h-full bg-white rounded-2xl shadow-xl overflow-hidden relative">
          {/* Overlay Effects */}
          {exitDirection === "right" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-green-500/30 z-20 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="bg-green-500 rounded-full p-8"
              >
                <Heart className="w-24 h-24 text-white" fill="white" />
              </motion.div>
            </motion.div>
          )}
          
          {exitDirection === "left" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-red-500/30 z-20 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="bg-red-500 rounded-full p-8"
              >
                <X className="w-24 h-24 text-white" />
              </motion.div>
            </motion.div>
          )}
          
          {exitDirection === "superlike" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-gradient-to-br from-blue-400/40 to-purple-600/40 z-20 flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1.2, rotate: 0 }}
                transition={{ type: "spring", damping: 10 }}
                className="relative"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-xl"
                />
                <div className="relative bg-gradient-to-br from-blue-400 to-purple-600 rounded-full p-8">
                  <Star className="w-24 h-24 text-white" fill="white" />
                </div>
              </motion.div>
            </motion.div>
          )}
          
          {/* Image Section */}
          <div className="relative w-full h-full">
          {profile.user_photos && profile.user_photos[currentImageIndex] && (
            <Image
              src={getImageUrl(profile.user_photos[currentImageIndex])}
              alt={`${profile.first_name} ${profile.last_name}`}
              fill
              className="object-cover"
              priority={isTop}
            />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />



          {/* Image Navigation - Only for top card */}
          {isTop && profile.user_photos && profile.user_photos.length > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center z-10 hover:bg-white/30 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>

              {/* Next Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center z-10 hover:bg-white/30 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>

              {/* Image Dots */}
              <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
                {profile.user_photos.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (setCurrentImageIndex) {
                        setCurrentImageIndex(idx)
                      }
                    }}
                    className={`flex-1 h-1 rounded-full transition-all ${
                      idx === currentImageIndex ? "bg-white" : "bg-white/40"
                    } hover:bg-white/60`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Profile Info - With better visibility */}
          <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 text-white z-10">
            {/* Extra gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent -z-10" />
            
            {/* Name and Age */}
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-3xl font-bold">
                {profile.first_name}{age ? `, ${age}` : ""}
              </h2>
              {profile.verification_status === "verified" && (
                <div className="bg-[#8b0000] rounded-full p-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Show spiritual org, location, or bio */}
            <div className="space-y-2">
              {/* Spiritual Organization - it's a text field, not array */}
              {spiritualOrgText && (
                <div className="mb-2">
                  <span className="px-3 py-1.5 bg-[#8b0000] rounded-full text-sm text-white font-medium line-clamp-1">
                    {spiritualOrgText}
                  </span>
                </div>
              )}
              
              {/* About Me / Bio */}
              {profile.about_me && (
                <p className="text-white/90 text-sm line-clamp-2">
                  {profile.about_me}
                </p>
              )}
              
              {/* Daily Practices if no other info */}
              {!profile.spiritual_org && !profile.about_me && profile.daily_practices && (
                <div className="text-white/90 text-sm">
                  Daily Practice: {profile.daily_practices}
                </div>
              )}
            </div>

            {/* View Profile Button - Bottom */}
            {isTop && onViewProfile && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onViewProfile(profile)
                }}
                className="mt-3 w-full py-2 px-4 bg-gradient-to-r from-[#8b0000] to-[#6b0000] rounded-lg flex items-center justify-center text-white font-medium text-sm shadow-md backdrop-blur-sm border border-white/20 hover:from-[#6b0000] hover:to-[#5a0000] hover:scale-[1.02] transition-all duration-200 active:scale-95"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                View Full Profile
              </button>
            )}
          </div>


        </div>
      </div>
    </motion.div>
  )
}

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
import MatchCelebration from "@/components/match-celebration"

interface SwipeStackProps {
  profiles: any[]
  onSwipe: (direction: "left" | "right" | "superlike", profileId: string) => void
  headerless?: boolean
  userProfile?: any
}

// Spiritual loading screen focused on loading progress
function SpiritualLoadingScreen() {
  const [dots, setDots] = useState(".")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "." : prev + ".")
    }, 500)

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 15
        return newProgress > 95 ? 20 : newProgress // Reset when near complete
      })
    }, 800)

    return () => {
      clearInterval(dotsInterval)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 text-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400"></div>
        </div>
        <div className="absolute top-20 right-16 animate-bounce delay-700">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-red-400"></div>
        </div>
        <div className="absolute bottom-16 left-16 animate-pulse delay-1000">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400"></div>
        </div>
        <div className="absolute bottom-10 right-10 animate-bounce delay-500">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-teal-400"></div>
        </div>
      </div>

      {/* Main loading lotus */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 animate-spin opacity-20"></div>
        <div className="absolute inset-2 w-20 h-20 rounded-full bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 animate-pulse"></div>
        <div className="absolute inset-4 w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 animate-spin" style={{animationDirection: 'reverse'}}></div>
        <div className="absolute inset-6 w-12 h-12 rounded-full bg-gradient-to-r from-white to-yellow-200 animate-pulse"></div>
        <div className="absolute inset-8 w-8 h-8 rounded-full bg-[#8b0000] animate-ping"></div>
      </div>

      {/* Loading text */}
      <div className="space-y-4 mb-8">
        <h2 className="text-2xl font-bold text-gray-800">
          Finding Your Spiritual Match{dots}
        </h2>
        <p className="text-gray-600">
          Searching through compatible profiles
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs mx-auto mb-4">
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-[#8b0000] to-red-500 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">{Math.round(progress)}% Complete</p>
      </div>

      {/* Loading steps */}
      <div className="space-y-2 text-sm text-gray-600">
        <div className={`flex items-center justify-center space-x-2 transition-opacity duration-500 ${progress > 20 ? 'opacity-100' : 'opacity-50'}`}>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Analyzing preferences</span>
        </div>
        <div className={`flex items-center justify-center space-x-2 transition-opacity duration-500 ${progress > 40 ? 'opacity-100' : 'opacity-50'}`}>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Matching spiritual compatibility</span>
        </div>
        <div className={`flex items-center justify-center space-x-2 transition-opacity duration-500 ${progress > 60 ? 'opacity-100' : 'opacity-50'}`}>
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>Finding dharmic connections</span>
        </div>
        <div className={`flex items-center justify-center space-x-2 transition-opacity duration-500 ${progress > 80 ? 'opacity-100' : 'opacity-50'}`}>
          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
          <span>Preparing your matches</span>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-1/4 left-1/4 animate-bounce delay-300 opacity-20">
        <span className="text-2xl">🪷</span>
      </div>
      <div className="absolute top-1/3 right-1/4 animate-pulse delay-700 opacity-20">
        <span className="text-xl">💫</span>
      </div>
      <div className="absolute bottom-1/3 right-1/3 animate-pulse delay-500 opacity-20">
        <span className="text-xl">✨</span>
      </div>
    </div>
  )
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
  const [processingSwipe, setProcessingSwipe] = useState(false)
  const [fetchingProfiles, setFetchingProfiles] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [showMatchCelebration, setShowMatchCelebration] = useState(false)
  const [matchedUser, setMatchedUser] = useState<any>(null)

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

  // Only sync profiles from parent when component first mounts or when explicitly refreshed
  // Don't interfere with internal swipe state management
  useEffect(() => {
    if (initialProfiles.length > 0) {
      setProfiles(initialProfiles)
    }
  }, [initialProfiles.length]) // Only trigger when length changes (new profiles loaded)

  const fetchData = async (retryCount = 0) => {
    setLoading(true)
    setError(null)
    try {
      // On mobile, fetch sequentially to reduce load and improve reliability
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      
      if (isMobile) {
        // Sequential fetching for mobile to be more reliable
        try {
          await fetchSwipeStats()
        } catch (statsError) {
          console.warn("SwipeStack: Stats fetch failed on mobile, continuing with profiles", statsError)
          // Don't fail completely if stats fail on mobile
        }
        await fetchProfiles()
      } else {
        // Parallel fetching for desktop
        await Promise.all([fetchSwipeStats(), fetchProfiles()])
      }
    } catch (err) {
      console.error(`SwipeStack: Error in fetchData (attempt ${retryCount + 1}):`, err)
      
      // More aggressive retry for mobile with longer delays
      const checkIsMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const maxRetries = checkIsMobile ? 5 : 2
      const baseDelay = checkIsMobile ? 3000 : 2000
      
      if (retryCount < maxRetries && err instanceof Error && 
          (err.message.includes('Network error') || err.message.includes('timed out') || 
           err.message.includes('Failed to fetch'))) {
        const delay = baseDelay * (retryCount + 1)
        console.log(`SwipeStack: Retrying after network error in ${delay}ms...`)
        setTimeout(() => fetchData(retryCount + 1), delay)
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
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const timeout = isMobile ? 20000 : 10000 // 20 seconds for mobile, 10 for desktop
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch("/api/swipe/stats", {
        credentials: "include",
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to fetch swipe stats: HTTP ${response.status}`
        throw new Error(errorMessage)
      }
      
      const stats = await response.json()
      setSwipeStats(stats)
      // console.log("SwipeStack: Fetched swipe stats successfully")
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
    // Prevent concurrent profile fetching
    if (fetchingProfiles) {
      console.log("SwipeStack: Profile fetch already in progress, skipping")
      return
    }
    
    setFetchingProfiles(true)
    try {
      const controller = new AbortController()
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const timeout = isMobile ? 45000 : 30000 // 45 seconds for mobile, 30 for desktop
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const response = await fetch("/api/profiles/discover", {
        credentials: "include",
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
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
      
      // console.log(`SwipeStack: Fetched ${profilesWithPhotos.length} profiles with photos`)
      
      // NEW: Append new profiles instead of replacing to maintain continuity
      setProfiles(prev => {
        // Get IDs of existing profiles to avoid duplicates
        const existingIds = new Set(prev.map(p => p.id))
        const newProfiles = profilesWithPhotos.filter((p: any) => !existingIds.has(p.id))
        // console.log(`SwipeStack: Adding ${newProfiles.length} new profiles (${existingIds.size} existing)`)
        
        // Extra safety: Deduplicate the final array by ID
        const combined = [...prev, ...newProfiles]
        const deduped = combined.filter((profile, index, self) => 
          self.findIndex(p => p.id === profile.id) === index
        )
        
        if (deduped.length !== combined.length) {
          console.warn(`SwipeStack: Removed ${combined.length - deduped.length} duplicate profiles`)
        }
        
        return deduped
      })
      
      // Silent fallback - no need to notify users about expanded search
    } catch (error) {
      console.error("SwipeStack: Error in fetchProfiles:", error)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn("SwipeStack: Request aborted (likely timeout)")
          throw new Error("Profile search is taking longer than expected. Please try again in a moment.")
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error("Network error. Please check your internet connection.")
        }
        if (error.message.includes('401')) {
          throw new Error("Authentication expired. Please refresh the page and try again.")
        }
      }
      
      throw error
    } finally {
      setFetchingProfiles(false)
    }
  }

  const handleViewProfile = (profile: any) => {
    setSelectedProfile(profile)
    setProfileModalOpen(true)
  }

  const handleSwipe = async (direction: "left" | "right" | "superlike", profileId: string) => {
    // Prevent swipe if card is already animating or processing
    if (exitingCard || processingSwipe) {
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

    // Optimistic UI update - trigger animation IMMEDIATELY
    setExitingCard({ id: profileId, direction })
    const animationDuration = direction === "superlike" ? 600 : 300
    
    // Update UI state immediately for instant feedback
    const swipedProfile = profiles[currentIndex]
    setTimeout(() => {
      setUndoStack(prev => [...prev, { profile: swipedProfile, direction, index: currentIndex }])
      setCurrentIndex(prev => prev + 1)
      setCurrentImageIndex(0)
      setExitingCard(null)
    }, animationDuration)

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

    // Call parent handler immediately
    onSwipe(direction, profileId)

    // Send API request in background (don't block UI)
    const sendSwipeRequest = async () => {
      try {
        let response = await fetch("/api/swipe", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            swiped_user_id: profileId,
            action: direction === "left" ? "dislike" : direction === "right" ? "like" : "superlike",
          }),
        })

        // Retry once on 401 (auth token might have refreshed)
        if (response.status === 401) {
          await new Promise(resolve => setTimeout(resolve, 500))
          response = await fetch("/api/swipe", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              swiped_user_id: profileId,
              action: direction === "left" ? "dislike" : direction === "right" ? "like" : "superlike",
            }),
          })
        }

        const result = await response.json()

        if (response.ok) {
          // Show match notification
          if (result.is_match) {
            setTimeout(() => {
              setMatchedUser(swipedProfile)
              setShowMatchCelebration(true)
            }, animationDuration + 100)
          } else if (direction === "superlike") {
            setTimeout(() => {
              toast.success("⭐ Super Like sent!")
            }, animationDuration)
          }

          // Load more profiles if running low
          if (currentIndex + 1 >= profiles.length - 3) {
            fetchProfiles().catch(error => {
              console.warn("SwipeStack: Background profile fetch failed:", error.message)
            })
          }
        } else {
          // Handle swipe limit reached (429 status)
          if (response.status === 429 && result.limit_reached) {
            // Rollback optimistic updates
            setSwipeStats((prev: any) => prev ? {
              ...prev,
              can_swipe: false,
              swipes_used: result.swipes_used || prev.swipes_used,
              swipes_remaining: 0
            } : prev)
            
            toast.error(result.upgrade_message || "Daily swipe limit reached!", {
              description: `You've used ${result.swipes_used}/${result.daily_limit} daily swipes on your ${result.current_plan} plan.`,
              action: {
                label: "Upgrade Plan",
                onClick: () => router.push(result.store_link || "/dashboard/store"),
              },
              duration: 8000,
            })
            return
          }
          
          // Handle super like limit reached (400 status with "No superlikes available")
          if (response.status === 400 && result.error?.includes("superlikes available")) {
            // Rollback super likes count
            setSwipeStats((prev: any) => prev ? {
              ...prev,
              super_likes_available: 0
            } : prev)
            
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
          
          // Handle 401 Unauthorized errors specifically
          if (response.status === 401) {
            toast.error("Session expired. Please refresh the page and try again.", {
              action: {
                label: "Refresh",
                onClick: () => window.location.reload(),
              },
              duration: 8000,
            })
            return
          }
          
          // Handle other errors
          if (!result.error?.includes("Already swiped")) {
            toast.error(result.error || "Failed to swipe")
          }
        }
      } catch (error) {
        // Handle network errors
        toast.error("Something went wrong. Please try again.")
      }
    }

    // Execute the API request in background
    setProcessingSwipe(true)
    sendSwipeRequest().finally(() => setProcessingSwipe(false))
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
    return <SpiritualLoadingScreen />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center px-4 h-full">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Error Loading Profiles</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchData()} className="bg-[#8b0000] hover:bg-[#6b0000]">Try Again</Button>
        </div>
      </div>
    )
  }

  const hasMoreProfiles = currentIndex < profiles.length

  if (!hasMoreProfiles) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <div className="flex items-center justify-center px-4 h-full">
          <div className="text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No More Profiles</h3>
            <p className="text-gray-600 mb-4">Check back later for new matches!</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => fetchProfiles().catch(error => console.error("Failed to refresh profiles:", error.message))} className="bg-[#8b0000] hover:bg-[#6b0000]">Refresh</Button>
              {undoStack.length > 0 && (
                <Button onClick={handleUndo} variant="outline" className="border-[#8b0000] text-[#8b0000] hover:bg-[#8b0000]/10">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Undo
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Match Celebration - Always available even when no more profiles */}
        <MatchCelebration
          isOpen={showMatchCelebration}
          onClose={() => setShowMatchCelebration(false)}
          onSendMessage={() => {
            setShowMatchCelebration(false)
            if (matchedUser) {
              router.push("/dashboard/messages")
            }
          }}
          onKeepSwiping={() => setShowMatchCelebration(false)}
          matchedUser={matchedUser || {}}
          currentUser={userProfile}
        />
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
            {/* Only show Super Likes count for Sangam and Samarpan plans */}
            {userProfile?.account_status && ['sangam', 'samarpan'].includes(userProfile.account_status) && (
              <div className="flex items-center gap-1 text-[#8b0000]">
                <Star className="w-4 h-4" fill="currentColor" />
                <span className="font-medium">{swipeStats.super_likes_available}</span>
              </div>
            )}
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
                isTop={index === 0}
                onSwipe={handleSwipe}
                onViewProfile={handleViewProfile}
                currentImageIndex={index === 0 ? currentImageIndex : 0}
                setCurrentImageIndex={index === 0 ? setCurrentImageIndex : undefined}
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
            className={`w-14 h-14 rounded-full bg-white shadow-md border-2 flex items-center justify-center transition-none active:scale-95 disabled:opacity-50 border-gray-200 hover:border-red-300`}
          >
            <X className="w-6 h-6 text-red-500" />
          </button>

          {/* Super Like - Only show for Sangam and Samarpan plans */}
          {userProfile?.account_status && ['sangam', 'samarpan'].includes(userProfile.account_status) ? (
            <button
              onClick={() => {
                const currentProfile = profiles[currentIndex]
                if (!exitingCard && currentProfile) {
                  if (!swipeStats?.super_likes_available || swipeStats?.super_likes_available <= 0) {
                    toast.error("No Super Likes available!", {
                      description: "Your monthly Super Likes have been used. They reset monthly or you can purchase more.",
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
              className="w-12 h-12 rounded-full shadow-md flex items-center justify-center transition-none active:scale-95 disabled:opacity-50 bg-[#8b0000] hover:bg-[#6b0000]"
            >
              <Star className="w-5 h-5 text-white" fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={() => {
                toast.error("Super Likes not available on your plan", {
                  description: "Upgrade to Sangam or Samarpan plan to use Super Likes",
                  action: {
                    label: "Upgrade Plan",
                    onClick: () => router.push("/dashboard/store"),
                  },
                  duration: 5000,
                })
              }}
              className="w-12 h-12 rounded-full shadow-md bg-gray-300 flex items-center justify-center transition-none active:scale-95"
            >
              <Star className="w-5 h-5 text-gray-500" />
            </button>
          )}

          {/* Like */}
          <button
            onClick={() => {
              const currentProfile = profiles[currentIndex]
              if (!exitingCard && currentProfile) {
                handleSwipe("right", currentProfile.id)
              }
            }}
            disabled={exitingCard !== null || !profiles[currentIndex]}
            className="w-14 h-14 rounded-full shadow-md flex items-center justify-center transition-none active:scale-95 disabled:opacity-50 bg-green-500 hover:bg-green-600"
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

      {/* Match Celebration */}
      <MatchCelebration
        isOpen={showMatchCelebration}
        onClose={() => setShowMatchCelebration(false)}
        onSendMessage={() => {
          setShowMatchCelebration(false)
          if (matchedUser) {
            router.push("/dashboard/messages")
          }
        }}
        onKeepSwiping={() => setShowMatchCelebration(false)}
        matchedUser={matchedUser || {}}
        currentUser={userProfile}
      />
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
        scale: exitDirection === "superlike" ? 1.1 : 1
      }}
      transition={{ 
        type: "tween", 
        duration: exitDirection === "superlike" ? 0.6 : 0.3, 
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
                initial={{ scale: 0 }}
                animate={{ scale: 1.1 }}
                transition={{ type: "spring", damping: 15, duration: 0.4 }}
                className="bg-gradient-to-br from-blue-400 to-purple-600 rounded-full p-8 shadow-2xl"
              >
                <Star className="w-24 h-24 text-white" fill="white" />
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
              sizes="(max-width: 768px) 100vw, 400px"
            />
          )}

          {/* Preload next images for smooth transitions */}
          {!isTop && profile.user_photos && profile.user_photos[0] && (
            <link
              rel="preload"
              as="image"
              href={getImageUrl(profile.user_photos[0])}
            />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

          {/* Super Like Indicator - Top Center */}
          {profile.has_super_liked_me && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
              className="absolute top-3 left-1/2 transform -translate-x-1/2 z-20"
            >
              {/* Main Badge Container */}
              <div className="bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 rounded-2xl px-3 py-2 shadow-xl border border-white/30">
                {/* Content */}
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-white drop-shadow-sm" fill="currentColor" />
                  <span className="text-white font-bold text-sm tracking-wide drop-shadow-sm">
                    Super Liked You!
                  </span>
                  <Sparkles className="w-4 h-4 text-white/90 drop-shadow-sm" />
                </div>
              </div>
            </motion.div>
          )}



          {/* Image Navigation - Only for top card */}
          {isTop && profile.user_photos && profile.user_photos.length > 1 && (
            <>
              {/* Previous Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center z-30 hover:bg-white/30 transition-colors"
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
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center z-30 hover:bg-white/30 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>

              {/* Image Dots */}
              <div className="absolute top-3 left-3 right-3 flex gap-1 z-30">
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
              {profile.has_super_liked_me && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full p-1.5 shadow-lg"
                >
                  <Star className="w-4 h-4 text-white" fill="currentColor" />
                </motion.div>
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

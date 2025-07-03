"use client"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import SwipeCard from "./swipe-card"
import { Button } from "@/components/ui/button"
import { Heart, X, Star, RotateCcw, Clock, Zap } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { isUserVerified } from "@/lib/utils"

interface SwipeStackProps {
  profiles: any[]
  onSwipe: (direction: "left" | "right" | "superlike", profileId: string) => void
  headerless?: boolean
  userProfile?: any
}

export default function SwipeStack({ profiles: initialProfiles, onSwipe, headerless = false, userProfile }: SwipeStackProps) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [undoStack, setUndoStack] = useState<any[]>([])
  const [swipeStats, setSwipeStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log("SwipeStack rendered with:", {
    profilesCount: initialProfiles.length,
    headerless,
    currentIndex,
    hasProfiles: profiles.length > 0,
    isVerified: userProfile ? isUserVerified(userProfile) : false,
  })

  // Check if user is verified
  const isVerified = userProfile ? isUserVerified(userProfile) : false

  // If not verified, show verification required message
  if (!isVerified) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Verification Required</h3>
          <p className="text-gray-600 mb-6">
            Your profile is currently under review. Once verified, you'll be able to swipe and discover compatible spiritual partners.
          </p>
          <Button 
            onClick={() => window.location.href = "/dashboard"}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Check Verification Status
          </Button>
        </div>
      </div>
    )
  }

  // Fetch swipe stats and profiles on mount
  useEffect(() => {
    console.log("SwipeStack useEffect running")
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([fetchSwipeStats(), fetchProfiles()])
    } catch (err) {
      console.error("Failed to load data:", err)
      setError("Failed to load profiles. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchSwipeStats = async () => {
    try {
      // Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error("No valid session")
      }

      // include credentials and authorization header
      const response = await fetch("/api/swipe/stats", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      // if the response isn't OK, throw to trigger your error state
      if (!response.ok) {
        throw new Error(`Failed to fetch swipe stats: ${response.status}`)
      }
      // parse and store
      const stats = await response.json()
      setSwipeStats(stats)
    } catch (error) {
      console.error("Error fetching swipe stats:", error)
      throw error
    }
  }

  const fetchProfiles = async () => {
    try {
      console.log("Fetching profiles...")

      // Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error("No valid session")
      }

      const response = await fetch("/api/profiles/discover", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      console.log("Profiles response:", response.status)
      if (!response.ok) {
        throw new Error(`Failed to fetch profiles: ${response.status}`)
      }
      const data = await response.json()
      console.log("Profiles data:", data)
      // Filter profiles to only include those with valid photos
      const profilesWithPhotos = (data.profiles || []).filter((profile: any) => 
        profile.user_photos && Array.isArray(profile.user_photos) && profile.user_photos.length > 0
      )
      setProfiles(profilesWithPhotos)
      
      // Show fallback message if expanded search was used
      if (data.fallback_used && data.profiles?.length > 0) {
        toast.info("✨ We've expanded your search to show more spiritual partners!", {
          duration: 4000,
        })
      }
    } catch (error) {
      console.error("Error fetching profiles:", error)
      throw error
    }
  }

  const handleSwipe = async (direction: "left" | "right" | "superlike", profileId: string) => {
    if (swiping) return

    // Check limits before swiping
    if (!swipeStats?.can_swipe) {
      toast.error("Daily swipe limit reached! Come back tomorrow or upgrade your plan.")
      return
    }

    if (direction === "superlike" && swipeStats?.super_likes_available <= 0) {
      toast.error("No Super Likes available! Purchase more or upgrade your plan.")
      return
    }

    setSwiping(true)

    try {
      const response = await fetch("/api/swipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          swiped_user_id: profileId,
          action: direction === "left" ? "dislike" : direction === "right" ? "like" : "superlike",
        }),
      })

      const result = await response.json()

      if (response.ok) {
        // Handle successful swipe
        const swipedProfile = profiles[currentIndex]
        setUndoStack((prev) => [...prev, { profile: swipedProfile, direction, index: currentIndex }])
        setCurrentIndex((prev) => prev + 1)

        // Update stats
        fetchSwipeStats()

        // Show match notification
        if (result.is_match) {
          toast.success("🎉 It's a match! You can now message each other.")
        } else if (direction === "superlike") {
          toast.success("⭐ Super Like sent!")
        }

        // Call parent callback
        onSwipe(direction, profileId)

        // Load more profiles if running low
        if (currentIndex >= profiles.length - 3) {
          fetchProfiles()
        }
      } else {
        if (result.limit_reached) {
          toast.error("Daily swipe limit reached! Upgrade your plan for more swipes.")
        } else {
          toast.error(result.error || "Failed to swipe")
        }
      }
    } catch (error) {
      console.error("Swipe error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSwiping(false)
    }
  }

  const handleUndo = () => {
    if (undoStack.length === 0) return

    const lastAction = undoStack[undoStack.length - 1]
    setUndoStack((prev) => prev.slice(0, -1))
    setCurrentIndex(lastAction.index)

    toast.success("Last action undone!")
  }

  const currentProfile = profiles[currentIndex]
  const hasMoreProfiles = currentIndex < profiles.length

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profiles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profiles</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={fetchData} className="bg-orange-600 hover:bg-orange-700">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!hasMoreProfiles) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No More Profiles</h3>
          <p className="text-gray-600 mb-6">
            You've seen all available profiles for now. Check back later for new spiritual partners!
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={fetchProfiles} className="bg-orange-600 hover:bg-orange-700">
              Refresh
            </Button>
            <Button onClick={handleUndo} variant="outline" disabled={undoStack.length === 0}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Undo
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 relative">
      {/* Header */}
      {!headerless && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Discover</h1>
                <p className="text-sm text-gray-600">Find your spiritual life partner</p>
              </div>
              <div className="flex items-center gap-4">
                {swipeStats && (
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {swipeStats.swipes_remaining} swipes left
                    </div>
                    <div className="text-xs text-gray-500">
                      {swipeStats.super_likes_available} super likes
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Swipe Cards Container - Optimized for mobile */}
      <div className="flex-1 flex items-center justify-center w-full px-2 sm:px-4">
        <div className="relative w-full max-w-sm aspect-[3/4] max-h-[calc(100vh-180px)] min-h-[400px]">
          <AnimatePresence>
            {profiles.slice(currentIndex, currentIndex + 3).map((profile, index) => (
              <SwipeCard
                key={profile.id}
                profile={profile}
                index={index}
                onSwipe={handleSwipe}
                onUndo={handleUndo}
                showUndo={undoStack.length > 0 && index === 0}
                isTop={index === 0}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Redesigned Action Buttons */}
      <div className="flex-shrink-0 pb-6 pt-6">
        <div className="flex items-center justify-center gap-6 sm:gap-8">
          {/* Dislike Button */}
          <motion.button
            onClick={() => handleSwipe("left", currentProfile?.id)}
            disabled={swiping}
            className="group relative w-14 h-14 sm:w-16 sm:h-16 bg-white border-2 border-red-200 rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-red-50 to-red-100 rounded-full group-hover:from-red-100 group-hover:to-red-200 transition-all duration-200" />
            <X className="relative w-6 h-6 sm:w-7 sm:h-7 text-red-500 group-hover:text-red-600 transition-colors" />
          </motion.button>

          {/* Super Like Button */}
          <motion.button
            onClick={() => handleSwipe("superlike", currentProfile?.id)}
            disabled={swiping || !swipeStats?.super_likes_available}
            className="group relative w-16 h-16 sm:w-20 sm:h-20 bg-white border-2 border-orange-200 rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-orange-50 to-orange-100 rounded-full group-hover:from-orange-100 group-hover:to-orange-200 transition-all duration-200" />
            <Star className="relative w-7 h-7 sm:w-8 sm:h-8 text-orange-500 group-hover:text-orange-600 transition-colors" fill="currentColor" />
          </motion.button>

          {/* Like Button */}
          <motion.button
            onClick={() => handleSwipe("right", currentProfile?.id)}
            disabled={swiping}
            className="group relative w-14 h-14 sm:w-16 sm:h-16 bg-white border-2 border-green-200 rounded-full shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-green-50 to-green-100 rounded-full group-hover:from-green-100 group-hover:to-green-200 transition-all duration-200" />
            <Heart className="relative w-6 h-6 sm:w-7 sm:h-7 text-green-500 group-hover:text-green-600 transition-colors" fill="currentColor" />
          </motion.button>
        </div>
      </div>

      {/* Undo Button */}
      {undoStack.length > 0 && !headerless && (
        <Button
          size="sm"
          variant="outline"
          className="absolute top-4 right-4"
          onClick={handleUndo}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Undo
        </Button>
      )}
    </div>
  )
}

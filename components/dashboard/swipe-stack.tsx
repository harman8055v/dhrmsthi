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

  // Fetch swipe stats and profiles on mount – but avoid triggering the
  // loading spinner if the parent already supplied a non-empty profile list.
  useEffect(() => {
    console.log("SwipeStack useEffect running")

    // If we already have profiles from the Dashboard query cache just fetch
    // the swipe stats silently. Skip the extra network call + spinner.
    if (initialProfiles && initialProfiles.length > 0) {
      setLoading(false)
      fetchSwipeStats().catch(console.error)
    } else {
      fetchData()
    }
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
      // Obtain current access token so the API can authenticate us
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`
      }

      const response = await fetch("/api/swipe", {
        method: "POST",
        credentials: "include",
        headers,
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

        // Allow the local animation inside SwipeCard to finish (~0.5s)
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1)
        }, 550)

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
    <div className="min-h-screen flex flex-col overflow-hidden items-center relative">
      {/* Swipe Cards Container - Optimized for mobile */}
      <div className="flex items-start justify-center w-full mt-6 mb-2">
        <div className="relative w-full max-w-sm h-[65vh] min-h-[360px]">
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
      <div className="flex-shrink-0 pb-4 pt-2">
        <div className="flex items-center justify-center gap-6 sm:gap-8">
          {/* Dislike Button - Redesigned */}
          <motion.button
            onClick={() => handleSwipe("left", currentProfile?.id)}
            disabled={swiping}
            className="group relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-400 via-red-500 to-pink-500 rounded-full shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center overflow-visible"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="absolute inset-0 rounded-full ring-2 ring-red-300 group-hover:ring-4 group-hover:ring-pink-400 transition-all duration-200 animate-pulse opacity-60" />
            <X className="relative w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-lg" />
          </motion.button>

          {/* Super Like Button - Redesigned */}
          <motion.button
            onClick={() => handleSwipe("superlike", currentProfile?.id)}
            disabled={swiping || !swipeStats?.super_likes_available}
            className="group relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-400 rounded-full shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center overflow-visible"
            whileHover={{ scale: 1.18 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="absolute inset-0 rounded-full ring-4 ring-yellow-200 group-hover:ring-8 group-hover:ring-pink-300 transition-all duration-200 animate-pulse opacity-70" />
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-10 bg-pink-200 rounded-full blur-xl opacity-40 animate-ping" />
            <Star className="relative w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-xl" fill="currentColor" />
          </motion.button>

          {/* Like Button - Redesigned */}
          <motion.button
            onClick={() => handleSwipe("right", currentProfile?.id)}
            disabled={swiping}
            className="group relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-400 rounded-full shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center overflow-visible"
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="absolute inset-0 rounded-full ring-2 ring-green-300 group-hover:ring-4 group-hover:ring-emerald-400 transition-all duration-200 animate-pulse opacity-60" />
            <Heart className="relative w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-lg" fill="currentColor" />
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

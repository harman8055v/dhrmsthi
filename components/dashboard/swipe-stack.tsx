"use client"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import SwipeCard from "./swipe-card"
import { Button } from "@/components/ui/button"
import { Heart, X, Star, Clock, RotateCcw } from "lucide-react"
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
  const [profiles, setProfiles] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [undoStack, setUndoStack] = useState<Array<{ profile: any; direction: string; index: number }>>([])
  const [swipeStats, setSwipeStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSwipeDirection, setCurrentSwipeDirection] = useState<"left" | "right" | "superlike" | null>(null)
  const [animatingButton, setAnimatingButton] = useState<"left" | "right" | "superlike" | null>(null)
  const [dragInProgress, setDragInProgress] = useState(false)
  
  const lastProfileFetch = useRef<number>(0)
  const processingProfileId = useRef<string | null>(null)

  // Simple plan check
  const getUserPlan = () => {
    return userProfile?.account_status || 'drishti'
  }

  const hasUndoAccess = () => {
    const plan = getUserPlan()
    return plan !== 'drishti'
  }

  // Initialize with profiles from dashboard
  useEffect(() => {
    if (initialProfiles && initialProfiles.length > 0) {
      console.log(`📋 Loaded ${initialProfiles.length} initial profiles`)
      setProfiles(initialProfiles)
      setCurrentIndex(0)
      setLoading(false)
    } else {
      // Fetch fresh profiles if none provided
      fetchProfiles()
    }
    
    // Always fetch stats
    fetchSwipeStats()
  }, [])

  // Watch for new profiles from dashboard
  useEffect(() => {
    if (initialProfiles && initialProfiles.length > 0) {
      console.log(`🔄 Received ${initialProfiles.length} new profiles from dashboard`)
      setProfiles(initialProfiles)
      setCurrentIndex(0)
      setLoading(false)
    }
  }, [initialProfiles])

  const fetchSwipeStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch("/api/swipe/stats", {
        credentials: "include",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (response.ok) {
        const stats = await response.json()
        setSwipeStats(stats)
      }
    } catch (error) {
      console.error("Error fetching swipe stats:", error)
    }
  }

  const fetchProfiles = async () => {
    try {
      // Prevent spam requests
      const now = Date.now()
      if (now - lastProfileFetch.current < 1000) {
        console.log('⏳ Skipping fetch - too recent')
        return
      }
      lastProfileFetch.current = now

      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error("No valid session")
      }

      console.log('🔄 Fetching fresh profiles...')
      const response = await fetch("/api/profiles/discover", {
        credentials: "include",
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch profiles: ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ Fetched ${data.profiles?.length || 0} profiles`)

      if (data.profiles && data.profiles.length > 0) {
        setProfiles(data.profiles)
        setCurrentIndex(0)
        setError(null)
      } else {
        console.log('❌ No profiles returned')
        setError("No more profiles available right now")
      }
    } catch (error) {
      console.error("❌ Error fetching profiles:", error)
      setError("Failed to load profiles")
    } finally {
      setLoading(false)
    }
  }

  const handleSwipe = async (direction: "left" | "right" | "superlike", profileId: string) => {
    // Prevent multiple swipes
    if (swiping || !profileId) return

    // Prevent swipes on a profile that's already being processed
    if (processingProfileId.current === profileId) {
      console.log(`🚫 Profile ${profileId} is already being processed`)
      return
    }

    console.log(`🔄 Swiping ${direction} on ${profileId}`)
    setSwiping(true)
    processingProfileId.current = profileId // Mark this profile as being processed

    // Check limits
    if (!swipeStats?.can_swipe) {
      toast.error("Daily swipe limit reached! Come back tomorrow or upgrade your plan.")
      setSwiping(false)
      processingProfileId.current = null
      return
    }

    if (direction === "superlike" && swipeStats?.super_likes_available <= 0) {
      toast.error("Out of Super Likes!", {
        description: "Would you like to buy more Super Likes?",
        action: {
          label: "Go to Store",
          onClick: () => window.location.href = "/dashboard/store"
        },
        duration: 5000,
      })
      setSwiping(false)
      processingProfileId.current = null
      return
    }

    // Set animation
    setCurrentSwipeDirection(direction)

    // Update UI after animation
    setTimeout(() => {
      const swipedProfile = profiles[currentIndex]
      if (swipedProfile && swipedProfile.id === profileId) { // Double-check profile match
        setUndoStack(prev => [...prev, { profile: swipedProfile, direction, index: currentIndex }])
        setCurrentIndex(prev => prev + 1)
        onSwipe(direction, profileId)
      } else {
        console.log('🚫 Profile mismatch during swipe, skipping UI update')
      }
      
      setCurrentSwipeDirection(null)
      setSwiping(false)
      processingProfileId.current = null // Clear processing flag

      // Fetch more profiles if running low
      if (currentIndex >= profiles.length - 3) {
        console.log('📊 Running low on profiles, fetching more...')
        fetchProfiles()
      }
    }, 400)

    // Background API call
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const res = await fetch("/api/swipe", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          swiped_user_id: profileId,
          action: direction === "left" ? "dislike" : direction === "right" ? "like" : "superlike",
        }),
      })

      if (res.ok) {
        const result = await res.json()
        if (result.is_match) {
          toast.success("🎉 It's a match! You can now message each other.")
        }
        // Refresh stats
        fetchSwipeStats()
      } else {
        const errorResponse = await res.text()
        console.error("❌ Swipe API failed:", errorResponse)
        
        // Parse error for better user feedback
        try {
          const errorData = JSON.parse(errorResponse)
          if (errorData.error === "Already swiped on this profile") {
            // This should NOT happen anymore with fixed backend, but just in case
            console.error("🚨 CRITICAL: Backend returned already-swiped profile! This is a bug.")
            toast.error("Something went wrong. Please refresh the page.")
            return
          }
          
          // Handle other specific errors
          if (errorData.limit_reached) {
            toast.error("Daily swipe limit reached! Come back tomorrow or upgrade your plan.")
            return
          }
        } catch (parseError) {
          // Response wasn't JSON, continue with generic error
        }
        
        toast.error("Something went wrong. Please try again.")
      }
    } catch (err) {
      console.error("❌ Swipe request failed:", err)
      toast.error("Network error. Please check your connection.")
    } finally {
      // Always clear the processing flag when API call completes
      if (processingProfileId.current === profileId) {
        processingProfileId.current = null
      }
    }
  }

  const handleButtonSwipe = (direction: "left" | "right" | "superlike", profileId?: string) => {
    if (!profileId || swiping) return
    
    setAnimatingButton(direction)
    setTimeout(() => setAnimatingButton(null), 300)
    
    handleSwipe(direction, profileId)
  }

  const handleUndo = async () => {
    if (undoStack.length === 0) return
    
    // Check if user has access to undo feature
    if (!hasUndoAccess()) {
      toast.error("Undo Feature Available for Paid Plans", {
        description: "Would you like to upgrade to access this feature?",
        action: {
          label: "Upgrade Plan",
          onClick: () => window.location.href = "/dashboard/store"
        },
        duration: 5000,
      })
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const lastAction = undoStack[undoStack.length - 1]
      
      const res = await fetch("/api/swipe/undo", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          swiped_user_id: lastAction.profile.id
        }),
      })

      if (res.ok) {
        setUndoStack(prev => prev.slice(0, -1))
        setCurrentIndex(prev => Math.max(0, prev - 1))
        toast.success("Undo successful!")
        fetchSwipeStats()
      }
    } catch (error) {
      console.error("Undo failed:", error)
    }
  }

  // Clear localStorage debug function
  const clearAllData = () => {
    localStorage.clear()
    fetchProfiles()
    toast.success("Cleared cache and refreshing!")
  }

  const currentProfile = profiles[currentIndex]
  const hasMoreProfiles = currentIndex < profiles.length

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center px-4" style={{
        paddingBottom: '200px' // Account for fixed buttons + nav bar + safety margin
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profiles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen bg-white flex items-center justify-center px-4" style={{
        paddingBottom: '200px' // Account for fixed buttons + nav bar + safety margin
      }}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Profiles</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={fetchProfiles} className="bg-orange-600 hover:bg-orange-700">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!hasMoreProfiles || !currentProfile) {
    return (
      <div className="h-screen bg-white flex items-center justify-center px-4" style={{
        paddingBottom: '200px' // Account for fixed buttons + nav bar + safety margin
      }}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No More Profiles</h3>
          <p className="text-gray-600 mb-6">
            You've seen all available profiles for now. Check back later for new spiritual partners!
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button onClick={fetchProfiles} className="bg-orange-600 hover:bg-orange-700">
              Refresh
            </Button>
            <Button onClick={handleUndo} variant="outline" disabled={undoStack.length === 0}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button onClick={clearAllData} variant="destructive" className="text-xs">
              🔧 Clear Cache
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Main Card Area - Aligned to top to maximize space */}
      <div className="flex-1 flex items-start justify-center px-4 pt-2 overflow-hidden">
        {/* Reserve exact space: 88px for our buttons + 72px for nav + 40px safety = 200px */}
        <div className="w-full max-w-sm relative" style={{ 
          height: 'calc(100vh - 240px)', // More conservative - reserve 240px total
          minHeight: '320px',
          maxHeight: 'calc(100vh - 240px)' // Prevent any overflow
        }}>
          <AnimatePresence>
            {profiles.slice(currentIndex, currentIndex + 3).map((profile, index) => (
              <SwipeCard
                key={profile.id}
                profile={profile}
                index={index}
                onSwipe={handleSwipe}
                onUndo={() => {}} // Empty function since we handle undo with buttons
                showUndo={false}
                isTop={index === 0}
                swipeDirection={index === 0 ? currentSwipeDirection : null}
                disabled={swiping} // Pass swiping state to prevent drag during button swipes
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Buttons - Positioned to not overlap with cards */}
      <div className="fixed left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-gray-100" style={{
        bottom: '72px' // Exactly above the nav bar height
      }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-center gap-3 max-w-sm mx-auto">
            {/* Undo Button */}
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className={`relative w-12 h-12 rounded-full shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center ${
                hasUndoAccess() 
                  ? "bg-gradient-to-br from-gray-500 to-gray-600" 
                  : "bg-gradient-to-br from-orange-400 to-orange-500"
              }`}
            >
              <RotateCcw className="w-5 h-5 text-white" />
              {!hasUndoAccess() && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Star className="w-2 h-2 text-white" fill="currentColor" />
                </div>
              )}
            </button>

            {/* Dislike Button */}
            <button
              onClick={() => currentProfile && handleButtonSwipe("left", currentProfile.id)}
              disabled={swiping || !currentProfile}
              className={`relative w-14 h-14 bg-gradient-to-br from-red-400 to-red-500 rounded-full shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-40 transition-all duration-200 flex items-center justify-center ${
                animatingButton === "left" ? "scale-110 animate-pulse" : ""
              }`}
            >
              <X className="w-7 h-7 text-white" strokeWidth={2.5} />
            </button>

            {/* Super Like Button */}
            <button
              onClick={() => currentProfile && handleButtonSwipe("superlike", currentProfile.id)}
              disabled={swiping || !currentProfile}
              className={`relative w-16 h-16 bg-gradient-to-br from-blue-400 via-purple-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-40 transition-all duration-200 flex items-center justify-center ${
                animatingButton === "superlike" ? "scale-110 animate-pulse" : ""
              }`}
            >
              <Star className="w-8 h-8 text-white" fill="currentColor" strokeWidth={1} />
            </button>

            {/* Like Button */}
            <button
              onClick={() => currentProfile && handleButtonSwipe("right", currentProfile.id)}
              disabled={swiping || !currentProfile}
              className={`relative w-14 h-14 bg-gradient-to-br from-green-400 to-green-500 rounded-full shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-40 transition-all duration-200 flex items-center justify-center ${
                animatingButton === "right" ? "scale-110 animate-pulse" : ""
              }`}
            >
              <Heart className="w-7 h-7 text-white" fill="currentColor" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { swipeService, matchService, premiumService, UserProfile, Match } from '@/lib/data-service'
import { useAuth } from './use-auth'

interface SwipeState {
  profiles: UserProfile[]
  currentIndex: number
  loading: boolean
  error: string | null
  hasMore: boolean
}

interface MatchState {
  matches: Match[]
  loading: boolean
  error: string | null
}

export function useSwipe() {
  const { user, isPremium } = useAuth()
  const [swipeState, setSwipeState] = useState<SwipeState>({
    profiles: [],
    currentIndex: 0,
    loading: false,
    error: null,
    hasMore: true
  })

  const [matchState, setMatchState] = useState<MatchState>({
    matches: [],
    loading: false,
    error: null
  })

  const [dailyStats, setDailyStats] = useState({
    swipes_used: 0,
    superlikes_used: 0,
    message_highlights_used: 0
  })

  // Load initial profiles
  useEffect(() => {
    if (user) {
      loadProfiles()
      loadMatches()
      loadDailyStats()
    }
  }, [user])

  const loadProfiles = async () => {
    if (!user) return

    try {
      setSwipeState(prev => ({ ...prev, loading: true, error: null }))
      
      const profiles = await swipeService.getProfilesToSwipe(10)
      
      setSwipeState(prev => ({
        ...prev,
        profiles,
        currentIndex: 0,
        loading: false,
        hasMore: profiles.length > 0
      }))
    } catch (error: any) {
      console.error('Load profiles error:', error)
      setSwipeState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load profiles'
      }))
    }
  }

  const loadMatches = async () => {
    if (!user) return

    try {
      setMatchState(prev => ({ ...prev, loading: true, error: null }))
      
      const matches = await matchService.getMatches()
      
      setMatchState({
        matches,
        loading: false,
        error: null
      })
    } catch (error: any) {
      console.error('Load matches error:', error)
      setMatchState({
        matches: [],
        loading: false,
        error: error.message || 'Failed to load matches'
      })
    }
  }

  const loadDailyStats = async () => {
    if (!user) return

    try {
      const stats = await premiumService.getDailyStats()
      setDailyStats(stats)
    } catch (error) {
      console.error('Load daily stats error:', error)
    }
  }

  const swipe = async (action: 'like' | 'dislike' | 'superlike'): Promise<{ isMatch: boolean } | null> => {
    if (!user || swipeState.currentIndex >= swipeState.profiles.length) {
      return null
    }

    const currentProfile = swipeState.profiles[swipeState.currentIndex]
    if (!currentProfile) return null

    // Check daily limits for non-premium users
    if (!isPremium) {
      const maxSwipes = 50
      const maxSuperlikes = 5

      if (action === 'superlike' && dailyStats.superlikes_used >= maxSuperlikes) {
        setSwipeState(prev => ({
          ...prev,
          error: 'Daily super like limit reached. Upgrade to premium for unlimited super likes.'
        }))
        return null
      }

      if (dailyStats.swipes_used >= maxSwipes) {
        setSwipeState(prev => ({
          ...prev,
          error: 'Daily swipe limit reached. Upgrade to premium for unlimited swipes.'
        }))
        return null
      }
    }

    try {
      const result = await swipeService.recordSwipe(currentProfile.id, action)
      
      // Move to next profile
      setSwipeState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        error: null
      }))

      // Update daily stats
      await loadDailyStats()

      // If match, refresh matches
      if (result.isMatch) {
        await loadMatches()
      }

      // Load more profiles if needed
      if (swipeState.currentIndex + 1 >= swipeState.profiles.length - 2) {
        await loadMoreProfiles()
      }

      return result
    } catch (error: any) {
      console.error('Swipe error:', error)
      setSwipeState(prev => ({
        ...prev,
        error: error.message || 'Failed to record swipe'
      }))
      return null
    }
  }

  const loadMoreProfiles = async () => {
    if (!user || swipeState.loading || !swipeState.hasMore) return

    try {
      setSwipeState(prev => ({ ...prev, loading: true }))
      
      const newProfiles = await swipeService.getProfilesToSwipe(5)
      
      setSwipeState(prev => ({
        ...prev,
        profiles: [...prev.profiles, ...newProfiles],
        loading: false,
        hasMore: newProfiles.length > 0
      }))
    } catch (error: any) {
      console.error('Load more profiles error:', error)
      setSwipeState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load more profiles'
      }))
    }
  }

  const getCurrentProfile = (): UserProfile | null => {
    if (swipeState.currentIndex >= swipeState.profiles.length) {
      return null
    }
    return swipeState.profiles[swipeState.currentIndex] || null
  }

  const getMatchWithProfile = async (matchId: string) => {
    try {
      return await matchService.getMatchWithProfile(matchId)
    } catch (error: any) {
      console.error('Get match with profile error:', error)
      return null
    }
  }

  const clearError = () => {
    setSwipeState(prev => ({ ...prev, error: null }))
    setMatchState(prev => ({ ...prev, error: null }))
  }

  const resetSwipeState = () => {
    setSwipeState({
      profiles: [],
      currentIndex: 0,
      loading: false,
      error: null,
      hasMore: true
    })
  }

  return {
    // Swipe state
    profiles: swipeState.profiles,
    currentIndex: swipeState.currentIndex,
    currentProfile: getCurrentProfile(),
    swipeLoading: swipeState.loading,
    swipeError: swipeState.error,
    hasMoreProfiles: swipeState.hasMore,
    
    // Match state
    matches: matchState.matches,
    matchesLoading: matchState.loading,
    matchesError: matchState.error,
    
    // Daily stats
    dailyStats,
    
    // Actions
    swipe,
    loadMoreProfiles,
    getMatchWithProfile,
    refreshMatches: loadMatches,
    refreshStats: loadDailyStats,
    clearError,
    resetSwipeState,
    
    // Computed values
    canSwipe: swipeState.currentIndex < swipeState.profiles.length,
    remainingSwipes: isPremium ? Infinity : Math.max(0, 50 - dailyStats.swipes_used),
    remainingSuperlikes: isPremium ? Infinity : Math.max(0, 5 - dailyStats.superlikes_used)
  }
} 
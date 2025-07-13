import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { userService, UserProfile } from '@/lib/data-service'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: 'Failed to get session'
          })
          return
        }

        if (session?.user) {
          // Check for temp profile in localStorage for immediate display
          const tempProfile = localStorage.getItem('tempUserProfile');
          if (tempProfile) {
            try {
              const profile = JSON.parse(tempProfile);
              if (profile.id === session.user.id) {
                setAuthState({
                  user: session.user,
                  profile,
                  loading: false,
                  error: null
                });
                localStorage.removeItem('tempUserProfile');
              }
            } catch (e) {
              console.error('Failed to parse temp profile:', e);
            }
          }
          
          // Fetch fresh profile
          try {
            const profile = await userService.getCurrentProfile(session.user.id)
            setAuthState({
              user: session.user,
              profile,
              loading: false,
              error: null
            })
          } catch (error) {
            console.error('Profile fetch error:', error)
            setAuthState({
              user: session.user,
              profile: null,
              loading: false,
              error: 'Failed to load profile'
            })
          }
        } else {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null
          })
        }
      } catch (error) {
        console.error('Auth init error:', error)
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: 'Authentication error'
        })
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (session?.user) {
          try {
            const profile = await userService.getCurrentProfile(session.user.id)
            setAuthState({
              user: session.user,
              profile,
              loading: false,
              error: null
            })
          } catch (error) {
            console.error('Profile fetch error:', error)
            setAuthState({
              user: session.user,
              profile: null,
              loading: false,
              error: 'Failed to load profile'
            })
          }
        } else {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const refreshProfile = async () => {
    if (!authState.user) return
    
    try {
      const profile = await userService.getCurrentProfile(authState.user.id)
      setAuthState(prev => ({
        ...prev,
        profile,
        error: null
      }))
    } catch (error) {
      console.error('Profile refresh error:', error)
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to refresh profile'
      }))
    }
  }

  return {
    user: authState.user,
    profile: authState.profile,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user,
    isMobileLogin: false, // Always false now - no special mobile handling
    isVerified: authState.profile?.verification_status === 'verified',
    isPremium: authState.profile?.account_status === 'premium' || authState.profile?.account_status === 'elite',
    refreshProfile,
    signOut
  }
} 
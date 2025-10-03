import { useState, useEffect, useCallback, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { userService, UserProfile } from '@/lib/data-service'
import { logger } from '@/lib/logger'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  session: Session | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
    session: null
  })
  
  // Use refs to prevent duplicate profile fetches
  const isProfileLoadingRef = useRef(false)
  const lastProfileFetchRef = useRef<string | null>(null)
  
  // Mobile login has been removed; this flag is always false but preserved for backward compatibility.
  const isMobileLoginUser = false;

  // Fetch user profile with deduplication
  const fetchUserProfile = useCallback(async (user: User) => {
    // Prevent duplicate fetches
    if (isProfileLoadingRef.current || lastProfileFetchRef.current === user.id) {
      return
    }
    
    try {
      isProfileLoadingRef.current = true
      lastProfileFetchRef.current = user.id
      
      logger.log('[useAuth] Fetching profile for user:', user.id)
      const profile = await userService.getCurrentProfile(user.id)
      
      setAuthState(prev => ({
        ...prev,
        profile,
        loading: false,
        error: null
      }))
    } catch (error) {
      logger.error('[useAuth] Profile fetch error:', error)
      setAuthState(prev => ({
        ...prev,
        profile: null,
        loading: false,
        error: 'Failed to load profile'
      }))
    } finally {
      isProfileLoadingRef.current = false
    }
  }, [])

  useEffect(() => {
    let mounted = true;

    // Skip auth initialization on password reset page
    const isPasswordResetPage = typeof window !== 'undefined' && window.location.pathname === '/reset-password';
    if (isPasswordResetPage) {
      logger.log('[useAuth] Skipping auth init on password reset page')
      setAuthState(prev => ({
        ...prev,
        loading: false
      }))
      return;
    }

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Get the initial session from cookies/storage
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return;
        
        if (error) {
          logger.error('[useAuth] Initial session error:', error)
          setAuthState(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to initialize auth'
          }))
          return
        }

        if (session?.user) {
          // Set user immediately to prevent auth redirects
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            session: session,
            loading: true // Keep loading true until profile is fetched
          }))
          
          // Then fetch profile
          await fetchUserProfile(session.user)
        } else {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null,
            session: null
          })
        }
      } catch (error) {
        logger.error('[useAuth] Auth initialization error:', error)
        if (mounted) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: 'Authentication error',
            session: null
          })
        }
      }
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Skip all auth processing on password reset page
        const isPasswordResetPage = typeof window !== 'undefined' && window.location.pathname === '/reset-password';
        if (isPasswordResetPage) {
          logger.log('[useAuth] Skipping auth event on password reset page:', event)
          return;
        }
        
        logger.log('[useAuth] Auth event:', event, session?.user?.id)
        
        // IGNORE PASSWORD_RECOVERY - let ResetPasswordClient handle it exclusively
        if (event === 'PASSWORD_RECOVERY') {
          logger.log('[useAuth] Ignoring PASSWORD_RECOVERY event - handled by reset page')
          return
        }
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null,
            session: null
          })
          return
        }
        
        // Handle sign in and token refresh
        if (session?.user) {
          const userChanged = session.user.id !== authState.user?.id
          
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            session: session,
            loading: userChanged || !prev.profile
          }))
          
          // Only fetch profile if user changed or no profile exists
          if (userChanged || !authState.profile) {
            await fetchUserProfile(session.user)
          }
        }
      }
    )

    // Start initialization
    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchUserProfile])

  const signOut = useCallback(async () => {
    try {
      logger.log('[useAuth] Signing out...')
      setAuthState(prev => ({ ...prev, loading: true }))
      
      // Clear refs to prevent any ongoing profile fetches
      isProfileLoadingRef.current = false
      lastProfileFetchRef.current = null
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        logger.error('[useAuth] Sign out error:', error)
        // Force clear state even if there's an error
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: null,
          session: null
        })
        
        // Clear any persisted session data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dharmasaathi-auth')
        }
      }
    } catch (error) {
      logger.error('[useAuth] Sign out exception:', error)
      // Force clear state on any error
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        error: null,
        session: null
      })
      
      // Clear any persisted session data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('dharmasaathi-auth')
      }
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!authState.user) {
      logger.warn('[useAuth] Cannot refresh profile - no user')
      return
    }

    try {
      logger.log('[useAuth] Manually refreshing profile...')
      
      // Force a fresh fetch by clearing the last fetch ref
      lastProfileFetchRef.current = null
      
      await fetchUserProfile(authState.user)
    } catch (error) {
      logger.error('[useAuth] Profile refresh error:', error)
    }
  }, [authState.user, fetchUserProfile])

  // Force refresh auth session (useful for fixing stale sessions)
  const refreshSession = useCallback(async () => {
    try {
      logger.log('[useAuth] Refreshing session...')
      const { data: { session }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        logger.error('[useAuth] Session refresh error:', error)
        // If refresh fails, try to get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (!currentSession) {
          // No valid session, clear state
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: 'Session expired',
            session: null
          })
        }
      } else if (session) {
        logger.log('[useAuth] Session refreshed successfully')
      }
    } catch (error) {
      logger.error('[useAuth] Session refresh exception:', error)
    }
  }, [])

  return {
    ...authState,
    signOut,
    refreshProfile,
    refreshSession,
    isAuthenticated: !!authState.user && !!authState.session,
    isProfileComplete: !!authState.profile?.is_onboarded,
    isVerified: authState.profile?.verification_status === 'verified',
    isPremium: authState.profile?.account_status === 'sangam' || authState.profile?.account_status === 'samarpan',
    isMobileLogin: isMobileLoginUser
  }
} 
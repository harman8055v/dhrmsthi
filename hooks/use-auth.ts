import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { userService, UserProfile } from '@/lib/data-service'
import { logger } from '@/lib/logger'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

// Mobile-login flow has been removed; the hook now relies solely on Supabase auth sessions.

export function useAuth() {
  // Initialize with mobile login state checked synchronously
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  })
  const [authReady, setAuthReady] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  // Mobile login has been removed; this flag is always false but preserved for backward compatibility.
  const isMobileLoginUser = false;

  // Check for mobile login on mount
  useEffect(() => {
    // Initialise session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authReady) return;
    // Get initial session
    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only log important auth events
        if (event !== 'INITIAL_SESSION') {
          logger.log('Auth state changed:', event, session?.user?.id)
        }
        
        // IGNORE PASSWORD_RECOVERY - let ResetPasswordClient handle it exclusively
        if (event === 'PASSWORD_RECOVERY') {
          logger.log('[useAuth] Ignoring PASSWORD_RECOVERY event - handled by reset page')
          return
        }
        
        if (session?.user) {
          await handleUserSession(session.user)
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
  }, [authReady])

  const getInitialSession = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }))
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        logger.error('Session error:', error)
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: 'Failed to get session'
        })
        return
      }

      if (session?.user) {
        await handleUserSession(session.user)
      } else {
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: null
        })
      }
    } catch (error) {
      logger.error('Initial session error:', error)
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        error: 'Authentication error'
      })
    }
  }

  const handleUserSession = async (user: User) => {
    if (!authReady || isLoadingProfile) return;    // ← do not fetch until token set or if already loading
    
    try {
      setIsLoadingProfile(true);
      // Get user profile
      const profile = await userService.getCurrentProfile(user.id)
      
      setAuthState({
        user,
        profile,
        loading: false,
        error: null
      })
    } catch (error) {
      logger.error('[useAuth] profile fetch error:', error)
      setAuthState({
        user,
        profile: null,
        loading: false,
        error: 'Failed to load profile'
      })
    } finally {
      setIsLoadingProfile(false);
    }
  }

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        logger.error('Sign out error:', error)
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to sign out' 
        }))
        return
      }

      setAuthState({
        user: null,
        profile: null,
        loading: false,
        error: null
      })
    } catch (error) {
      logger.error('Sign out error:', error)
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Sign out failed' 
      }))
    }
  }

  const refreshProfile = async () => {
    if (!authState.user) return
    if (!authReady) return;    // ← do not fetch until token set

    try {
      logger.log('[useAuth] refreshProfile()');
      logger.time('[useAuth] refreshProfile.getCurrentProfile');
      const profile = await userService.getCurrentProfile(authState.user.id)
      logger.timeEnd('[useAuth] refreshProfile.getCurrentProfile');
      
      setAuthState(prev => ({
        ...prev,
        profile,
        error: null
      }))
    } catch (error) {
      logger.error('[useAuth] Profile refresh error:', error)
      setAuthState(prev => ({
        ...prev,
        error: 'Failed to refresh profile'
      }))
    }
  }

  return {
    ...authState,
    signOut,
    refreshProfile,
    isAuthenticated: !!authState.user,
    isProfileComplete: !!authState.profile?.is_onboarded,
    isVerified: authState.profile?.verification_status === 'verified',
    isPremium: authState.profile?.account_status === 'sangam' || authState.profile?.account_status === 'samarpan',
    isMobileLogin: isMobileLoginUser
  }
} 
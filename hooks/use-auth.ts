import { useState, useEffect, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { userService, UserProfile } from '@/lib/data-service'

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
  // Mobile login has been removed; this flag is always false but preserved for backward compatibility.
  const isMobileLoginUser = false;

  // Check for mobile login on mount
  useEffect(() => {
    // Initialise session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[useAuth] initial getSession done', { session });
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authReady) return;
    console.log('[useAuth] authReady effect fired');
    // Get initial session
    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
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
      console.log('[useAuth] getInitialSession result', { session, error });
      
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
        console.log('[useAuth] session.user present, calling handleUserSession');
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
      console.error('Initial session error:', error)
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        error: 'Authentication error'
      })
    }
  }

  // Track the last loaded userId to avoid redundant fetches (e.g. due to React Strict Mode or repeated auth events)
  const lastLoadedUserId = useRef<string | null>(null)

  const handleUserSession = async (user: User) => {
    if (!authReady) return // wait until client ready

    // If we've already loaded this user's profile, skip
    if (lastLoadedUserId.current === user.id && authState.profile) {
      return
    }

    try {
      console.time('[useAuth] getCurrentProfile')
      const profile = await userService.getCurrentProfile(user.id)
      console.timeEnd('[useAuth] getCurrentProfile')

      lastLoadedUserId.current = user.id

      setAuthState({
        user,
        profile,
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error('[useAuth] profile fetch error:', error)
      setAuthState({
        user,
        profile: null,
        loading: false,
        error: 'Failed to load profile',
      })
    }
  }

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
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
      console.error('Sign out error:', error)
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
      console.log('[useAuth] refreshProfile()');
      setAuthState(prev => ({ ...prev, loading: true }))
      console.time('[useAuth] refreshProfile.getCurrentProfile');
      const profile = await userService.getCurrentProfile(authState.user.id)
      console.timeEnd('[useAuth] refreshProfile.getCurrentProfile');
      
      setAuthState(prev => ({
        ...prev,
        profile,
        loading: false,
        error: null
      }))
    } catch (error) {
      console.error('[useAuth] Profile refresh error:', error)
      setAuthState(prev => ({
        ...prev,
        loading: false,
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
    isPremium: authState.profile?.account_status === 'premium' || authState.profile?.account_status === 'elite',
    isMobileLogin: isMobileLoginUser
  }
} 
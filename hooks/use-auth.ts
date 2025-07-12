import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { userService, UserProfile } from '@/lib/data-service'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

// Check mobile login synchronously
const checkIsMobileLogin = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('isMobileLogin') === 'true';
};

export function useAuth() {
  // Initialize with mobile login state checked synchronously
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  })
  const [authReady, setAuthReady] = useState(false);
  // Track mobile login state separately for immediate access
  const [isMobileLoginUser, setIsMobileLoginUser] = useState(checkIsMobileLogin());

  // Check for mobile login on mount
  useEffect(() => {
    const checkMobileLogin = async () => {
      if (typeof window === 'undefined') return;
      
      const isMobileLogin = localStorage.getItem('isMobileLogin') === 'true';
      const mobileLoginUserId = localStorage.getItem('mobileLoginUserId');
      
      if (isMobileLogin && mobileLoginUserId) {
        console.log('[useAuth] Mobile login detected, loading profile');
        setIsMobileLoginUser(true);
        
        try {
          // Use API endpoint for mobile login users
          const response = await fetch(`/api/users/profile?userId=${mobileLoginUserId}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch profile');
          }
          
          const { profile } = await response.json();
          
          if (profile) {
            setAuthState({
              user: null, // No auth user for mobile login
              profile,
              loading: false,
              error: null
            });
            // Don't clear mobile login data here - let components handle it
            return true; // Indicate mobile login was handled
          }
        } catch (error) {
          console.error('[useAuth] Mobile login profile fetch error:', error);
          // Clear invalid mobile login data
          localStorage.removeItem('isMobileLogin');
          localStorage.removeItem('mobileLoginUserId');
          setIsMobileLoginUser(false);
        }
      }
      return false;
    };

    checkMobileLogin().then(isMobileLogin => {
      if (!isMobileLogin) {
        // Only initialize regular auth if not mobile login
        supabase.auth.getSession().then(({ data: { session } }) => {
          console.log('[useAuth] initial getSession done', { session });
          setAuthReady(true);
        });
      } else {
        // For mobile login, set authReady without waiting for session
        setAuthReady(true);
      }
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      console.log('[useAuth] onAuthStateChange', { session });
      // Clear mobile login data if a real session is established
      if (session && typeof window !== 'undefined') {
        localStorage.removeItem('isMobileLogin');
        localStorage.removeItem('mobileLoginUserId');
        setIsMobileLoginUser(false);
      }
    });
    
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Skip auth listener for mobile login users
    const isMobileLogin = typeof window !== 'undefined' && localStorage.getItem('isMobileLogin') === 'true';
    if (isMobileLogin) return;

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

  const handleUserSession = async (user: User) => {
    if (!authReady) return;    // ← do not fetch until token set
    
    try {
      // Get user profile
      console.time('[useAuth] getCurrentProfile');
      const profile = await userService.getCurrentProfile(user.id)
      console.timeEnd('[useAuth] getCurrentProfile');
      console.log('[useAuth] profile loaded', profile);
      
      setAuthState({
        user,
        profile,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('[useAuth] profile fetch error:', error)
      setAuthState({
        user,
        profile: null,
        loading: false,
        error: 'Failed to load profile'
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
    isAuthenticated: !!authState.user || !!authState.profile, // Mobile login users have profile but no user
    isProfileComplete: !!authState.profile?.is_onboarded,
    isVerified: authState.profile?.verification_status === 'verified',
    isPremium: authState.profile?.account_status === 'premium' || authState.profile?.account_status === 'elite',
    isMobileLogin: isMobileLoginUser // Use the synchronously checked state
  }
} 
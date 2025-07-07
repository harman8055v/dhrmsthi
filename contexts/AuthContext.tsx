"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import { userService, type UserProfile } from "@/lib/data-service"

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  isAuthenticated: boolean
  isProfileComplete: boolean
  isVerified: boolean
  isPremium: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
  })

  // Fetch initial session + subscribe to auth changes
  useEffect(() => {
    const getInitialSession = async () => {
      setAuthState((prev) => ({ ...prev, loading: true }))

      try {
        // Simply get the session without waiting
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("[AuthContext] Session error:", error)
          setAuthState({ user: null, profile: null, loading: false, error: null })
          return
        }

        if (session?.user) {
          await handleUserSession(session.user)
        } else {
          setAuthState({ user: null, profile: null, loading: false, error: null })
        }
      } catch (err) {
        console.error("[AuthContext] Failed to get auth session", err)
        setAuthState({ user: null, profile: null, loading: false, error: null })
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await handleUserSession(session.user)
      } else {
        setAuthState({ user: null, profile: null, loading: false, error: null })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleUserSession = async (user: User) => {
    try {
      // Directly fetch profile using user.id instead of relying on getUser()
      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      if (error) {
        console.error("Supabase profile fetch error:", error)
        // Non-fatal: proceed with null profile
      }

      setAuthState({ user, profile: profile || null, loading: false, error: null })
    } catch (err) {
      console.error("Profile fetch error:", err)
      setAuthState({ user, profile: null, loading: false, error: "Failed to load profile" })
    }
  }

  const signOut = async () => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true }))
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      setAuthState({ user: null, profile: null, loading: false, error: null })
    } catch (err: any) {
      console.error("Sign out error:", err)
      setAuthState((prev) => ({ ...prev, loading: false, error: err.message || "Sign out failed" }))
    }
  }

  const refreshProfile = async () => {
    if (!authState.user) return
    try {
      setAuthState((prev) => ({ ...prev, loading: true }))
      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authState.user.id)
        .maybeSingle()

      if (error) {
        console.error("Supabase profile refresh error:", error)
      }

      setAuthState((prev) => ({ ...prev, profile: profile || null, loading: false }))
    } catch (err) {
      console.error("Profile refresh error:", err)
      setAuthState((prev) => ({ ...prev, loading: false, error: "Failed to refresh profile" }))
    }
  }

  const value: AuthContextValue = {
    ...authState,
    signOut,
    refreshProfile,
    isAuthenticated: !!authState.user,
    isProfileComplete: !!(authState.profile as any)?.is_onboarded,
    isVerified: authState.profile?.verification_status === "verified",
    isPremium:
      authState.profile?.account_status === "premium" || authState.profile?.account_status === "elite",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
} 
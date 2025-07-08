"use client"

import { createContext, useContext, ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"

/**
 * AuthContext provides user, profile and helper flags to the subtree.
 * The value comes from the existing useAuth() hook, so we only hit Supabase
 * once per app load instead of repeating the request in every dashboard page.
 */
const AuthContext = createContext<ReturnType<typeof useAuth> | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider")
  }
  return ctx
} 
"use client"

import { ReactNode, useEffect } from "react"
import { useAuthContext } from "@/components/auth-provider"
import MobileNav from "@/components/dashboard/mobile-nav"
import { useRouter } from "next/navigation"

interface DashboardLayoutProps {
  children: ReactNode
}

// Top-level layout that shows persistent mobile navigation.
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardShell>{children}</DashboardShell>
}

function DashboardShell({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuthContext()
  const router = useRouter()

  // Redirect to home only if we have neither Supabase user nor profile (covers mobile login)
  useEffect(() => {
    if (!loading && !user && !profile) {
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        router.replace("/")
      }, 0)
    }
  }, [loading, user, profile, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      {/* Persistent Mobile Navigation */}
      <MobileNav userProfile={profile} />

      {/* Page content (individual routes) with minimal padding for native header */}
      <div className="pt-14">
        {children}
      </div>
    </div>
  )
} 
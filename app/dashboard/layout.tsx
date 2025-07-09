"use client"

import { ReactNode } from "react"
import { AuthProvider, useAuthContext } from "@/components/auth-provider"
import { ReactQueryProvider } from "@/components/react-query-provider"
import MobileNav from "@/components/dashboard/mobile-nav"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface DashboardLayoutProps {
  children: ReactNode
}

// Top-level layout that provides auth context once and shows persistent mobile navigation.
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthProvider>
      <ReactQueryProvider>
        <DashboardShell>{children}</DashboardShell>
      </ReactQueryProvider>
    </AuthProvider>
  )
}

function DashboardShell({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuthContext()
  const router = useRouter()

  // Redirect to /login if the user is not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Persistent Mobile Navigation */}
      <MobileNav userProfile={profile} />

      {/* Page content (individual routes) */}
      {children}
    </div>
  )
} 
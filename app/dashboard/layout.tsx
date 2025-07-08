"use client"

import { ReactNode } from "react"
import { AuthProvider, useAuthContext } from "@/components/auth-provider"
import { ReactQueryProvider } from "@/components/react-query-provider"
import MobileNav from "@/components/dashboard/mobile-nav"

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
  const { profile } = useAuthContext()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Persistent Mobile Navigation */}
      <MobileNav userProfile={profile} />

      {/* Page content (individual routes) */}
      {children}
    </div>
  )
} 
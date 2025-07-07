"use client"

import dynamic from "next/dynamic"
import { Suspense, useEffect, useState } from "react"
import { DashboardViewProvider, useDashboardView } from "@/contexts/DashboardViewContext"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

// Lazy load individual views
const HomeView = dynamic(() => import("@/components/dashboard/home-view"), { ssr: false })
const MatchesView = dynamic(() => import("./matches/page"), { ssr: false })
const MessagesView = dynamic(() => import("./messages/page"), { ssr: false })
const StoreView = dynamic(() => import("./store/page"), { ssr: false })
const ProfileView = dynamic(() => import("./profile/page"), { ssr: false })

function Views() {
  const ctx = useDashboardView()
  if (!ctx) return null
  const { activeView } = ctx

  return (
    <Suspense>
      <div className={activeView === "home" ? "block" : "hidden"}>
        <HomeView />
      </div>
      <div className={activeView === "matches" ? "block" : "hidden"}>
        <MatchesView />
      </div>
      <div className={activeView === "messages" ? "block" : "hidden"}>
        <MessagesView />
      </div>
      <div className={activeView === "store" ? "block" : "hidden"}>
        <StoreView />
      </div>
      <div className={activeView === "profile" ? "block" : "hidden"}>
        <ProfileView />
      </div>
    </Suspense>
  )
}

export default function DashboardPage() {
  const { user, loading } = useAuth()

  // If no user, redirect to home
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/"
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Just show the dashboard - no onboarding checks!
  return (
    <DashboardViewProvider>
      <Views />
    </DashboardViewProvider>
  )
}

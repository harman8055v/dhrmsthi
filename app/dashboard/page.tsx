"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import { debugLog } from "@/lib/logger"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { Heart, User } from "lucide-react"
import SettingsCard from "@/components/dashboard/settings-card"
import dynamic from "next/dynamic"

const SwipeStack = dynamic(() => import("@/components/dashboard/swipe-stack"), { ssr: false })
import WelcomeSection from "@/components/dashboard/welcome-section"
import NewUserWelcome from "@/components/dashboard/new-user-welcome"
import { isUserVerified, getVerificationStatusText } from "@/lib/utils"

export default function DashboardPage() {
  // Include refreshProfile so we can manually trigger a fetch on first mount
  const { user, profile, loading: isLoading, error, isVerified, refreshProfile, isMobileLogin } = useAuthContext()
  const router = useRouter()

  const {
    data: profiles = [],
    isLoading: profilesLoading,
    refetch: refetchProfiles,
  } = useQuery({
    queryKey: ["profiles", "discover"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const headers: Record<string, string> = {}
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`
      }

      const res = await fetch("/api/profiles/discover", {
        credentials: "include",
        headers,
      })
      if (!res.ok) throw new Error("Failed to fetch profiles")
      const data = await res.json()
      return data.profiles || []
    },
    enabled: isVerified,
    staleTime: 30000, // 30 seconds - reasonable for a web app
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  })

  const {
    data: swipeStats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["swipe", "stats"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const headers: Record<string, string> = {}
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`
      }

      const res = await fetch("/api/swipe/stats", {
        credentials: "include",
        headers,
      })
      if (!res.ok) throw new Error("Failed to fetch swipe stats")
      return res.json()
    },
    enabled: isVerified,
    staleTime: 60000, // 1 minute for stats
    refetchOnWindowFocus: true,
  })

  // Redirect unauthenticated users and handle onboarding status
  useEffect(() => {
    console.log('[Dashboard]', { isLoading, error, profile, user, isMobileLogin });
    if (isLoading) return;
    
    // For mobile login users, only check profile
    if (isMobileLogin) {
      if (!profile) {
        console.log('[Dashboard] Mobile login but no profile, redirecting to home');
        router.replace("/");
        return;
      }
      
      if (!(profile as any)?.is_onboarded) {
        console.log('[Dashboard] Mobile login not onboarded → redirecting');
        router.replace('/onboarding');
        return;
      }
    } else {
      // Regular auth flow
      if (!user && !profile) {
        router.replace("/")
        return;
      }
      
      if (!(profile as any)?.is_onboarded) {
        console.log('[Dashboard] not onboarded → redirecting');
        router.replace('/onboarding');
        return;
      }
    }
  }, [isLoading, user, profile, router, error, isMobileLogin])

  // If the component mounts with a user but no profile (fresh after onboarding),
  // trigger one manual refresh so the dashboard shows real data without reload.
  useEffect(() => {
    if (!isLoading && user && !profile) {
      console.log('[Dashboard] profile missing → calling refreshProfile()')
      refreshProfile()
    }
  }, [isLoading, user, profile, refreshProfile])

  const calculateProfileCompleteness = () => {
    if (!profile) return 0

    const prof: any = profile // dynamic access

    const fields = [
      "first_name",
      "last_name",
      "phone",
      "gender",
      "birthdate",
      "city_id",
      "state_id",
      "country_id",
      "education",
      "profession",
      "diet",
      "ideal_partner_notes",
      "about_me",
      "spiritual_org",
      "daily_practices",
    ]

    const arrayFields = ["user_photos"]

    const isValuePresent = (val: any): boolean => {
      if (!val) return false
      if (Array.isArray(val)) return val.length > 0
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val)
          if (Array.isArray(parsed)) return parsed.length > 0
        } catch {
          /* not JSON */
        }
        return val.trim() !== ""
      }
      return true
    }

    let completed = 0

    fields.forEach((field) => {
      if (isValuePresent(prof[field])) completed++
    })

    arrayFields.forEach((field) => {
      if (isValuePresent(prof[field])) completed++
    })

    const total = fields.length + arrayFields.length
    return Math.min(100, Math.round((completed / total) * 100))
  }

  const getNextTuesday = () => {
    const now = new Date()
    const nextTuesday = new Date()
    const daysUntilTuesday = (2 - now.getDay() + 7) % 7 || 7 // 2 = Tuesday
    nextTuesday.setDate(now.getDate() + daysUntilTuesday)
    nextTuesday.setHours(18, 0, 0, 0) // 6 PM

    return (
      nextTuesday.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }) + " at 6:00 PM IST"
    )
  }

  const isNewUser = () => {
    if (!profile?.created_at) return true
    const createdAt = new Date(profile.created_at)
    const now = new Date()
    const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    return hoursSinceCreated <= 24 // New if created within last 24 hours
  }

  const handleSwipe = (direction: "left" | "right" | "superlike", profileId: string) => {
    debugLog(`Swiped ${direction} on profile ${profileId}`)
    // Delayed refetch to prevent state conflicts during swipe processing
    setTimeout(() => {
      refetchProfiles()
      refetchStats()
    }, 1000) // Longer delay to ensure swipe is fully processed
  }

  if (isLoading) {
    return <>{require("./loading").default()}</>;
  }

  console.log("Dashboard - Is verified:", isVerified)

  return (
    <>
      {isVerified ? (
        // VERIFIED USER - Full Swipe Interface
        <main className="min-h-screen w-full overflow-hidden">
          <SwipeStack profiles={profiles} onSwipe={handleSwipe} userProfile={profile} headerless={false} />
        </main>
      ) : (
        // UNVERIFIED USER - Verification Dashboard
        <main className="pt-20 pb-32 min-h-screen flex flex-col">
          <div className="px-4 space-y-6 max-w-4xl mx-auto">
            {/* New User Welcome */}
            <div>
              <NewUserWelcome profile={profile} />
            </div>



            {/* Settings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SettingsCard
                title="Complete Profile"
                description="Add more details to speed up verification"
                icon={<User className="w-5 h-5" />}
                onClick={() => router.push("/dashboard/settings")}
              />
              <SettingsCard
                title="Partner Preferences"
                description="Set your ideal partner criteria"
                icon={<Heart className="w-5 h-5" />}
                onClick={() => router.push("/dashboard/preferences")}
              />
            </div>
          </div>
        </main>
      )}
    </>
  )
}

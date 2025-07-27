"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import { debugLog } from "@/lib/logger"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
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
      const res = await fetch("/api/profiles/discover?limit=5", { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch profiles")
      const data = await res.json()
      return (data.profiles || []).slice(0, 5)
    },
    enabled: isVerified,
  })

  const {
    data: swipeStats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["swipe", "stats"],
    queryFn: async () => {
      let res = await fetch("/api/swipe/stats", { credentials: "include" })
      
      // Retry once on 401 (auth token might need refresh)
      if (res.status === 401) {
        await new Promise(resolve => setTimeout(resolve, 500))
        res = await fetch("/api/swipe/stats", { credentials: "include" })
      }
      
      if (!res.ok) throw new Error("Failed to fetch swipe stats")
      return res.json()
    },
    enabled: !!(isVerified && user && profile), // More specific auth check
    retry: (failureCount, error) => {
      // Retry up to 2 times, but not for 401 errors (those need user action)
      if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
        return false
      }
      return failureCount < 2
    },
    retryDelay: 1000,
  })

  // Redirect unauthenticated users and handle onboarding status
  useEffect(() => {
    debugLog('[Dashboard]', { isLoading, error, profile, user, isMobileLogin });
    if (isLoading) return;
    
    // For mobile login users, only check profile
    if (isMobileLogin) {
      if (!profile) {
        debugLog('[Dashboard] Mobile login but no profile, redirecting to home');
        router.replace("/");
        return;
      }
      
      if (!(profile as any)?.is_onboarded) {
        debugLog('[Dashboard] Mobile login not onboarded → redirecting');
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
        debugLog('[Dashboard] not onboarded → redirecting');
        router.replace('/onboarding');
        return;
      }
    }
    
    if (error) {
      debugLog('[Dashboard] profile load error:', error);
      // Don't redirect on error for mobile login users
      if (!isMobileLogin) {
        return;
      }
    }
    
    // When verified, fetch page-specific data
    if (isVerified) {
      refetchProfiles();
      refetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, error, profile, user, isVerified, isMobileLogin])

  // If the component mounts with a user but no profile (fresh after onboarding),
  // trigger one manual refresh so the dashboard shows real data without reload.
  useEffect(() => {
    if (!isLoading && user && !profile) {
      debugLog('[Dashboard] profile missing → calling refreshProfile()')
      refreshProfile()
    }
  }, [isLoading, user, profile, refreshProfile])

  const calculateProfileCompleteness = () => {
    if (!profile) return 0

    // Cast to any for dynamic key access because UserProfile type does not include all onboarding fields explicitly
    const prof: any = profile
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
    ]

    const arrayFields = ["spiritual_org", "daily_practices", "user_photos"]

    let completed = 0
    const total = fields.length + arrayFields.length

    fields.forEach((field) => {
      if (prof[field] && prof[field].toString().trim() !== "") {
        completed++
      }
    })

    arrayFields.forEach((field) => {
      if (prof[field] && Array.isArray(prof[field]) && prof[field].length > 0) {
        completed++
      }
    })

    return Math.round((completed / total) * 100)
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
    // Refresh stats after swipe
    refetchStats()
  }

  if (isLoading) {
    return <>{require("./loading").default()}</>;
  }

  debugLog("Dashboard - Is verified:", isVerified)

  return (
    <>
      {isVerified ? (
        // VERIFIED USER - Full Swipe Interface
        <main className="fixed inset-0 pb-20">
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
              {calculateProfileCompleteness() === 100 ? (
                // Profile Complete - Show congratulatory cards
                <>
                  <SettingsCard
                    title="Profile Verified Soon"
                    description="Your complete profile is in the verification queue"
                    icon={<User className="w-5 h-5" />}
                    onClick={() => router.push("/dashboard/account-settings")}
                  />
                  <SettingsCard
                    title="Partner Preferences"
                    description="Set your ideal partner criteria while you wait"
                    icon={<Heart className="w-5 h-5" />}
                    onClick={() => router.push("/dashboard/preferences")}
                  />
                </>
              ) : (
                // Profile Incomplete - Show completion cards
                <>
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
                </>
              )}
            </div>
          </div>
        </main>
      )}
    </>
  )
}

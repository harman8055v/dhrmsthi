"use client"

import { useEffect, useState, useRef } from "react"
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
  const { user, profile, loading } = useAuthContext()
  const router = useRouter()
  const [profiles, setProfiles] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [hasReferrals, setHasReferrals] = useState(false)
  
  // Check if user is verified
  const isVerified = profile ? isUserVerified(profile) : false

  // Fetch profiles and stats
  const loadData = async () => {
    try {
      // Fetch profiles
      const profilesRes = await fetch("/api/profiles/discover")
      const profilesData = await profilesRes.json()
      if (profilesData.profiles) {
        setProfiles(profilesData.profiles)
      }

      // Fetch stats
      const statsRes = await fetch("/api/swipe/stats")
      const statsData = await statsRes.json()
      if (statsData) {
        setStats(statsData)
      }

      // Check referrals
      const referralsRes = await fetch("/api/referrals")
      const referralsData = await referralsRes.json()
      if (referralsData.referrals && referralsData.referrals.length > 0) {
        setHasReferrals(true)
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    }
  }

  const refetchStats = () => {
    loadData()
  }

  // Simple redirect logic
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (profile && !profile.is_onboarded) {
        router.replace('/onboarding');
      } else if (profile && isVerified) {
        // Load dashboard data when profile is ready and verified
        loadData();
      }
    }
  }, [loading, user, profile, router, isVerified])

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

  if (loading) {
    return <>{require("./loading").default()}</>;
  }

  console.log("Dashboard - Is verified:", isVerified)

  return (
    <>
      {isVerified ? (
        // VERIFIED USER - Full Swipe Interface
        <main className="pt-20 pb-32 min-h-screen">
          <div className="px-4 max-w-4xl mx-auto">
            <SwipeStack profiles={profiles} onSwipe={handleSwipe} userProfile={profile} headerless={false} />
          </div>
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

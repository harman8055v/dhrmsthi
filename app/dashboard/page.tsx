"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { debugLog } from "@/lib/logger"
import { Button } from "@/components/ui/button"
import { Heart, User } from "lucide-react"
import { ReferralProgram } from "@/components/dashboard/referral-program"
import MobileNav from "@/components/dashboard/mobile-nav"
import SettingsCard from "@/components/dashboard/settings-card"
import SwipeStack from "@/components/dashboard/swipe-stack"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import WelcomeSection from "@/components/dashboard/welcome-section"
import NewUserWelcome from "@/components/dashboard/new-user-welcome"
import { isUserVerified, getVerificationStatusText } from "@/lib/utils"

export default function DashboardPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<any[]>([])
  const [swipeStats, setSwipeStats] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/")
          return
        }

        setUser(user)

        // Fetch user profile data
        const { data: profileData, error } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (error) {
          console.error("Error fetching user profile:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          })
          console.log("User ID:", user.id)
          console.log("User phone:", user.phone)
          console.log("User email:", user.email)
          
          // If user not found, they need to complete onboarding
          router.push("/onboarding")
          return
        }

        // If user hasn't completed onboarding, redirect to onboarding
        if (!profileData?.onboarding_completed) {
          router.push("/onboarding")
          return
        }

        setProfile(profileData)

        // Add debugging
        console.log("Profile data:", profileData)
        console.log("Verification status:", profileData?.verification_status)
        console.log("Account status:", profileData?.account_status)
        console.log("Is verified:", isUserVerified(profileData))

        // Only fetch profiles and swipe stats if user is verified
        if (isUserVerified(profileData)) {
          fetchProfiles()
          fetchSwipeStats()
        }

        setLoading(false)
      } catch (error) {
        console.error("Error in auth check:", error)
        router.push("/")
      }
    }

    getUser()
  }, [router])

  const fetchProfiles = async () => {
    try {
      const response = await fetch("/api/profiles/discover", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles || [])
      }
    } catch (error) {
      console.error("Error fetching profiles:", error)
    }
  }

  const fetchSwipeStats = async () => {
    try {
      const response = await fetch("/api/swipe/stats", { credentials: "include" })
      if (response.ok) {
        const stats = await response.json()
        setSwipeStats(stats)
      }
    } catch (error) {
      console.error("Error fetching swipe stats:", error)
    }
  }

  const calculateProfileCompleteness = () => {
    if (!profile) return 0

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
      if (profile[field] && profile[field].toString().trim() !== "") {
        completed++
      }
    })

    arrayFields.forEach((field) => {
      if (profile[field] && Array.isArray(profile[field]) && profile[field].length > 0) {
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
    fetchSwipeStats()
  }

  if (loading) {
    return <>{require("./loading").default()}</>;
  }

  const isVerified = isUserVerified(profile)

  console.log("Dashboard - Is verified:", isVerified)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Mobile Navigation */}
      <MobileNav userProfile={profile} />

      {/* Main Content */}
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



            {/* Referral Program Section */}
            <div data-referral-section>
              <ReferralProgram userId={user?.id || ""} userProfile={profile} />
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
    </div>
  )
}

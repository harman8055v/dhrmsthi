"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Heart, User } from "lucide-react"
import { ReferralProgram } from "@/components/dashboard/referral-program"
import MobileNav from "@/components/dashboard/mobile-nav"
import SettingsCard from "@/components/dashboard/settings-card"
import SwipeStack from "@/components/dashboard/swipe-stack"
import NewUserWelcome from "@/components/dashboard/new-user-welcome"
import { isUserVerified } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

export default function HomeView() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [showNewUserWelcome, setShowNewUserWelcome] = useState(false)

  // Just check if logged in, no onboarding checks
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  const verified = isUserVerified(profile)

  if (loading || !profile) {
    return null // Let child components handle their own loading if needed
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <MobileNav userProfile={profile} />

      {verified ? (
        <main className="pt-20 pb-32 min-h-screen">
          <div className="px-4 max-w-4xl mx-auto">
            <SwipeStack profiles={[]} onSwipe={() => {}} headerless={false} userProfile={profile} />
          </div>
        </main>
      ) : (
        <main className="pt-20 pb-32 min-h-screen flex flex-col">
          <div className="px-4 space-y-6 max-w-4xl mx-auto">
            <NewUserWelcome profile={profile} />

            <div data-referral-section>
              <ReferralProgram userId={user?.id || ""} userProfile={profile} />
            </div>

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
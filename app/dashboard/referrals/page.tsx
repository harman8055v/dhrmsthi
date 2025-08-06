"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Users, Gift, Copy, Share2, Star, CheckCircle, Zap, Crown } from "lucide-react"
import MobileNav from "@/components/dashboard/mobile-nav"
import { toast } from "sonner"
import { Toaster } from "sonner"

import { supabase } from "@/lib/supabase"
import { ReferralProgram } from "@/components/dashboard/referral-program"

export default function ReferralsPage() {
  const { user, profile, loading } = useAuthContext()
  const router = useRouter()

  if (loading) {
    return <>{require("./loading").default()}</>
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <MobileNav userProfile={profile} />
      <main className="pb-40 px-4 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <ReferralProgram userId={user.id} userProfile={profile} />
        </div>
      </main>
      <Toaster position="top-center" />
    </div>
  )
}

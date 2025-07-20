"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, 
  Shield, 
  Users, 
  CheckCircle, 
  Star, 
  Sparkles,
  UserCheck,
  Globe,
  Lock,
  ArrowRight,
  Crown,
  Zap
} from "lucide-react"
import { useRouter } from "next/navigation"

interface NewUserWelcomeProps {
  profile: any
}

export default function NewUserWelcome({ profile }: NewUserWelcomeProps) {
  const router = useRouter()

  const calculateProfileCompleteness = () => {
    /*
     * Updated logic – 2025-07-20
     * – Reflects latest users schema (spiritual_org & daily_practices are now TEXT not JSON/array)
     * – Counts these fields as complete when they are non-empty strings OR non-empty arrays (back-compat)
     * – Keeps photos as array-based check
     * – Guarantees percentage is between 0-100
     */

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

    let completed = 0

    const isValuePresent = (val: any): boolean => {
      if (!val) return false
      if (Array.isArray(val)) return val.length > 0
      if (typeof val === "string") {
        // Attempt to parse JSON arrays stored as strings (legacy data)
        try {
          const parsed = JSON.parse(val)
          if (Array.isArray(parsed)) return parsed.length > 0
        } catch (_) {
          /* noop – not JSON */
        }
        return val.trim() !== ""
      }
      return true
    }

    fields.forEach((field) => {
      if (isValuePresent(profile[field])) completed++
    })

    arrayFields.forEach((field) => {
      if (isValuePresent(profile[field])) completed++
    })

    const total = fields.length + arrayFields.length
    return Math.min(100, Math.round((completed / total) * 100))
  }

  const profileCompleteness = calculateProfileCompleteness()

  return (
    <div className="space-y-6 pt-4">
      {/* Hero Welcome Card */}
      <Card className="overflow-hidden border border-orange-200 shadow-xl bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="p-6 md:p-8">
          <div className="text-center space-y-6">
            {/* Welcome Header */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-r from-orange-200 to-amber-200 rounded-full blur opacity-40"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                  Welcome to DharmaSaathi, {profile?.first_name}! ✨
                </h1>
                <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  Your sacred journey to find a genuine spiritual life partner begins here. We're thrilled to have you join our conscious community!
                </p>
              </div>

              {/* Achievement Badges */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                <Badge className="bg-green-100 text-green-800 border border-green-200 px-2 md:px-3 py-1 text-xs md:text-sm">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Profile Created
                </Badge>
                <Badge className="bg-orange-100 text-orange-800 border border-orange-200 px-2 md:px-3 py-1 text-xs md:text-sm">
                  <Crown className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Community Member
                </Badge>
                <Badge className="bg-amber-100 text-amber-800 border border-amber-200 px-2 md:px-3 py-1 text-xs md:text-sm">
                  <Heart className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Spiritual Seeker
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Next Steps Journey */}
      <Card className="overflow-hidden border border-orange-200 shadow-lg bg-white">
        <CardContent className="p-6 md:p-8">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Your Path to Finding True Love 💕</h2>
            <p className="text-gray-600 text-sm md:text-base">Follow these sacred steps to connect with your perfect DharmaSaathi</p>
          </div>

          <div className="space-y-4 md:space-y-6">
            {/* Step 1: Profile Verification */}
            <div className="w-full bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-4 md:p-6">
              <div className="flex items-start gap-4 md:gap-6">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                    <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">Step 1: Profile Verification</h3>
                    <Badge className="bg-orange-100 text-orange-800 border border-orange-200 text-xs w-fit">In Progress</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      Our verification process ensures a safe, authentic community where you can confidently connect with genuine spiritual partners.
                    </p>
                    
                    {/* Why We Verify */}
                    <div className="bg-white rounded-xl p-3 md:p-4 space-y-3 border border-orange-100">
                      <h4 className="text-sm md:text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                        Why We Verify Every Profile:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0" />
                          <span>Women's safety & security</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 md:w-4 md:h-4 text-orange-600 flex-shrink-0" />
                          <span>Genuine community members</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="w-3 h-3 md:w-4 md:h-4 text-amber-600 flex-shrink-0" />
                          <span>Authentic spiritual seekers</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="w-3 h-3 md:w-4 md:h-4 text-red-500 flex-shrink-0" />
                          <span>Serious relationship intent</span>
                        </div>
                      </div>
                    </div>

                    {/* Profile Completeness */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs md:text-sm font-medium text-gray-700">Profile Completeness</span>
                        <span className="text-sm md:text-base font-bold text-orange-600">{profileCompleteness}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 md:h-3">
                        <div
                          className="bg-gradient-to-r from-orange-400 to-amber-500 h-2 md:h-3 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${profileCompleteness}%` }}
                        ></div>
                      </div>
                      {profileCompleteness === 100 ? (
                        <div className="space-y-3 text-center">
                          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Profile 100% Complete</span>
                          </div>
                          <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
                            Thank you for completing your profile! We’re currently receiving a high volume of applications.
                            To keep our community genuine and spam-free, new profiles may take up to <strong>4–7 business days</strong> to be verified.
                            You’ll receive an email & WhatsApp notification once your account is approved.
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-gray-600">
                            Complete profiles get verified faster! Add photos, spiritual details, and preferences.
                          </p>
                          <Button
                            onClick={() => router.push("/dashboard/settings")}
                            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white w-full sm:w-auto text-sm md:text-base"
                          >
                            <Zap className="w-4 h-4 mr-2" />
                            Complete Profile
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Find Your Perfect Match */}
            <div className="relative w-full">
              <div className="w-full bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200 opacity-60 p-4 md:p-6">
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                      <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900">Step 2: Discover Your Perfect DharmaSaathi</h3>
                      <Badge className="bg-gray-100 text-gray-600 border border-gray-200 text-xs w-fit">Available after verification</Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                        Once verified, you'll access our intelligent AI-powered matching system that connects you with spiritually compatible partners who share your values and life goals.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                        <div className="flex items-center gap-2">
                          <Star className="w-3 h-3 md:w-4 md:h-4 text-amber-600 flex-shrink-0" />
                          <span>AI-powered spiritual compatibility</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 h-3 md:w-4 md:h-4 text-orange-600 flex-shrink-0" />
                          <span>Location-based connections</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0" />
                          <span>Verified community members</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="w-3 h-3 md:w-4 md:h-4 text-red-500 flex-shrink-0" />
                          <span>Meaningful conversations</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Lock Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-md border border-gray-200">
                  <Lock className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Pro Tip – Fast-track Your Verification */}
            <div className="bg-gradient-to-r from-orange-100 to-amber-100 border-l-4 border-orange-500 rounded-lg p-4 md:p-5">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">💡</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-orange-800 mb-1 text-sm md:text-base">Pro Tip: Fast-track Your Verification</h5>
                  <p className="text-xs md:text-sm text-orange-700 mb-3">
                    Referring genuine friends to DharmaSaathi boosts your credibility score and helps our team verify you sooner.
                  </p>
                  <Button
                    onClick={() => router.push("/dashboard/referrals")}
                    size="sm"
                    variant="outline"
                    className="border-orange-400 text-orange-700 hover:bg-orange-200 text-xs"
                  >
                    <Users className="w-3 h-3 mr-1" />
                    View Referral Program
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Encouragement Footer – hide when profile is 100% complete */}
          {profileCompleteness < 100 && (
            <div className="mt-6 md:mt-8 p-4 md:p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200">
              <div className="text-center space-y-3 md:space-y-4">
                <div className="flex justify-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-base md:text-lg font-bold text-gray-900">You're Almost There! ✨</h3>
                <p className="text-sm md:text-base text-gray-700 max-w-2xl mx-auto">
                  Thousands of genuine spiritual souls are waiting to connect with someone like you. Complete your verification to join this beautiful community and begin your journey to true love.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center pt-2">
                  <Button
                    onClick={() => router.push("/dashboard/settings")}
                    className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg transition-all duration-300 text-sm md:text-base"
                  >
                    Complete My Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 
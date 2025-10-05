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
  Zap,
  Clock,
  ThumbsUp,
  MessageCircle,
  Eye,
  UserPlus
} from "lucide-react"
import { useRouter } from "next/navigation"

interface NewUserWelcomeProps {
  profile: any
}

export default function NewUserWelcome({ profile }: NewUserWelcomeProps) {
  const router = useRouter()

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

  const profileCompleteness = calculateProfileCompleteness()
  const isProfileComplete = profileCompleteness === 100

  return (
    <div className="space-y-6 pt-4">
      {/* Hero Welcome Card */}
      <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full blur-xl"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-white rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white rounded-full blur-lg"></div>
        </div>
        
        <div className="relative p-6 md:p-8">
          <div className="text-center space-y-6">
            {/* Welcome Header */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-4 bg-white/20 rounded-full blur-lg"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-white to-gray-100 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30">
                    {isProfileComplete ? (
                      <CheckCircle className="w-10 h-10 text-[#8b0000]" />
                    ) : (
                      <Sparkles className="w-10 h-10 text-[#8b0000]" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
                  {isProfileComplete ? `Thank you, ${profile?.first_name}!` : `Welcome to DharmaSaathi, ${profile?.first_name}!`}
                </h1>
                <p className="text-sm md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow">
                  {isProfileComplete 
                    ? "Your profile is complete and ready for verification. We appreciate the time you've taken to provide detailed information about yourself."
                    : "Your journey to finding a meaningful life partner begins here. We're delighted to have you join our community of values-driven individuals."
                  }
                </p>
              </div>

              {/* Achievement Badges */}
              <div className="flex flex-wrap justify-center gap-2">
                <div className="inline-flex items-center gap-1.5 bg-green-500/80 backdrop-blur-sm border border-green-400/40 rounded-full px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Profile Created
                </div>
                
                {isProfileComplete && (
                  <div className="inline-flex items-center gap-1.5 bg-green-500/80 backdrop-blur-sm border border-green-400/40 rounded-full px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Profile Complete
                  </div>
                )}
                
                <div className="inline-flex items-center gap-1.5 bg-orange-500/80 backdrop-blur-sm border border-orange-400/40 rounded-full px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg">
                  <Clock className="w-3.5 h-3.5" />
                  Verification Under Process
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Next Steps Journey */}
      <Card className="overflow-hidden border-0 shadow-xl bg-white">
        <CardContent className="p-6 md:p-8">
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#8b0000] to-red-700 rounded-2xl mb-4 shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {isProfileComplete ? "Your Verification Timeline" : "Your Path to Meaningful Connection"}
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              {isProfileComplete 
                ? "Here's what happens next and how to make the most of our platform"
                : "Follow these steps to connect with compatible life partners"
              }
            </p>
          </div>

          <div className="space-y-6">
            {/* Step 1: Profile Verification */}
            <div className="relative bg-gradient-to-r from-[#8b0000]/5 via-red-50 to-[#8b0000]/5 rounded-3xl border-2 border-[#8b0000]/10 p-6 md:p-8 overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#8b0000]/5 to-transparent rounded-full -mr-16 -mt-16"></div>
              
              <div className="relative flex items-start gap-4 md:gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-[#8b0000] to-red-700 rounded-2xl flex items-center justify-center shadow-xl border-4 border-white">
                    {isProfileComplete ? (
                      <Clock className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    ) : (
                      <Shield className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">
                      {isProfileComplete ? "Verification in Progress" : "Step 1: Profile Verification"}
                    </h3>
                    <Badge className={`text-xs w-fit font-semibold px-3 py-1 ${
                      isProfileComplete 
                        ? "bg-[#8b0000]/10 text-[#8b0000] border border-[#8b0000]/20" 
                        : "bg-orange-100 text-orange-800 border border-orange-200"
                    }`}>
                      {isProfileComplete ? "Usually minutes (max 4 hours)" : "In Progress"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-5">
                    {isProfileComplete ? (
                      <>
                        <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                          Most profiles are verified in a few minutes and no later than 4 hours. We'll notify you via WhatsApp and email once you're verified or if we need more information. Completing your profile helps avoid unnecessary delays.
                        </p>
                        
                        <div className="bg-white rounded-2xl p-4 md:p-5 space-y-4 border-2 border-[#8b0000]/10 shadow-lg">
                          <h4 className="text-sm md:text-base font-semibold text-gray-900 flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#8b0000]/10 rounded-lg flex items-center justify-center">
                              <Clock className="w-4 h-4 text-[#8b0000]" />
                            </div>
                            What's Happening Now:
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                              <UserCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                              <span className="text-sm text-gray-700">Your profile is in the verification queue</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[#8b0000]/5 rounded-xl border border-[#8b0000]/20">
                              <Shield className="w-5 h-5 text-[#8b0000] flex-shrink-0" />
                              <span className="text-sm text-gray-700">Our team is reviewing your information</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                              <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                              <span className="text-sm text-gray-700">You'll be notified via WhatsApp and email once verified or if we need more info</span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                          Our verification process ensures a secure, authentic community where you can confidently connect with genuine individuals seeking meaningful relationships.
                        </p>
                        
                        <div className="bg-white rounded-2xl p-4 md:p-5 space-y-4 border-2 border-[#8b0000]/10 shadow-lg">
                          <h4 className="text-sm md:text-base font-semibold text-gray-900 flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#8b0000]/10 rounded-lg flex items-center justify-center">
                              <Lock className="w-4 h-4 text-[#8b0000]" />
                            </div>
                            Why We Verify Every Profile:
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                              <UserCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span className="text-xs md:text-sm text-gray-700">Safe & secure environment</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[#8b0000]/5 rounded-xl border border-[#8b0000]/20">
                              <Users className="w-4 h-4 text-[#8b0000] flex-shrink-0" />
                              <span className="text-xs md:text-sm text-gray-700">Authentic community members</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                              <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
                              <span className="text-xs md:text-sm text-gray-700">Values-aligned individuals</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-200">
                              <Heart className="w-4 h-4 text-red-500 flex-shrink-0" />
                              <span className="text-xs md:text-sm text-gray-700">Serious relationship intent</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Profile Completeness */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm md:text-base font-semibold text-gray-900">Profile Completeness</span>
                        <span className="text-lg md:text-xl font-bold text-[#8b0000]">{profileCompleteness}%</span>
                      </div>
                      <div className="relative w-full bg-gray-200 rounded-full h-3 md:h-4 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#8b0000] to-red-600 h-full rounded-full transition-all duration-1000 ease-out shadow-lg"
                          style={{ width: `${profileCompleteness}%` }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      </div>
                      
                      {isProfileComplete ? (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 shadow-md">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm md:text-base font-bold text-green-800">Profile Complete!</span>
                          </div>
                          <p className="text-xs md:text-sm text-green-700">
                            Excellent! Your detailed profile helps us find the best matches for you.
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs md:text-sm text-gray-600">
                            Complete profiles get verified faster! Add photos, personal details, and preferences.
                          </p>
                          <Button
                            onClick={() => router.push("/dashboard/settings")}
                            className="bg-gradient-to-r from-[#8b0000] to-red-700 hover:from-red-800 hover:to-red-900 text-white w-full sm:w-auto text-sm md:text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 border-0"
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
            <div className="relative opacity-60">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl border-2 border-gray-200 p-6 md:p-8">
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Heart className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900">Step 2: Discover Compatible Partners</h3>
                      <Badge className="bg-gray-100 text-gray-600 border border-gray-200 text-xs w-fit font-semibold px-3 py-1">Available after verification</Badge>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                        Once verified, you'll access our intelligent matching system that connects you with compatible partners who share your values and relationship goals.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                          <Star className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <span className="text-xs md:text-sm text-gray-700">AI-powered compatibility matching</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                          <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="text-xs md:text-sm text-gray-700">Location-based connections</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                          <Users className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-xs md:text-sm text-gray-700">Verified community members</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                          <Heart className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span className="text-xs md:text-sm text-gray-700">Meaningful conversations</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Lock Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/95 backdrop-blur-sm rounded-full p-4 shadow-xl border-2 border-gray-300">
                  <Lock className="w-8 h-8 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Tips for Finding Genuine Partners (shown only when profile is complete) */}
            {isProfileComplete && (
              <div className="bg-gradient-to-br from-[#8b0000]/5 via-red-50 to-[#8b0000]/10 border-2 border-[#8b0000]/20 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-bl from-[#8b0000]/10 to-transparent rounded-full"></div>
                
                <div className="relative space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#8b0000] to-red-700 rounded-3xl mb-4 shadow-xl">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Tips for Finding Your Genuine Partner</h4>
                    <p className="text-sm md:text-base text-gray-600">Make the most of your DharmaSaathi experience</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#8b0000]/10 to-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Eye className="w-5 h-5 text-[#8b0000]" />
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-900 text-sm mb-2">Look Beyond Photos</h5>
                          <p className="text-xs text-gray-600 leading-relaxed">Read profiles thoroughly. Values, interests, and life goals matter more than appearance.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#8b0000]/10 to-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-5 h-5 text-[#8b0000]" />
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-900 text-sm mb-2">Start Meaningful Conversations</h5>
                          <p className="text-xs text-gray-600 leading-relaxed">Ask about their values, aspirations, and what they're truly seeking in a partner.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#8b0000]/10 to-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-[#8b0000]" />
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-900 text-sm mb-2">Take Your Time</h5>
                          <p className="text-xs text-gray-600 leading-relaxed">Build genuine connections. Quality conversations lead to lasting relationships.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#8b0000]/10 to-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <UserCheck className="w-5 h-5 text-[#8b0000]" />
                        </div>
                        <div>
                          <h5 className="font-bold text-gray-900 text-sm mb-2">Trust Your Instincts</h5>
                          <p className="text-xs text-gray-600 leading-relaxed">If something feels off, it probably is. Genuine people are consistent and transparent.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pro Tip – Fast-track Your Verification (shown only when profile is not complete) */}
            {!isProfileComplete && (
              <div className="bg-gradient-to-r from-[#8b0000]/10 via-red-50 to-[#8b0000]/5 border-l-4 border-[#8b0000] rounded-2xl p-5 md:p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#8b0000] to-red-700 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm font-bold">💡</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-[#8b0000] mb-2 text-sm md:text-base">Pro Tip: Accelerate Your Verification</h5>
                    <p className="text-xs md:text-sm text-gray-700 mb-4 leading-relaxed">
                      Referring genuine friends to DharmaSaathi boosts your credibility score and helps our team verify you sooner.
                    </p>
                    <Button
                      onClick={() => router.push("/dashboard/referrals")}
                      size="sm"
                      variant="outline"
                      className="border-2 border-[#8b0000] text-[#8b0000] hover:bg-[#8b0000] hover:text-white text-xs font-semibold shadow-md transition-all duration-300"
                    >
                      <Users className="w-3 h-3 mr-2" />
                      View Referral Program
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Encouragement Footer */}
          <div className="mt-8 p-6 md:p-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 rounded-3xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-5 left-5 w-16 h-16 bg-white rounded-full blur-xl"></div>
              <div className="absolute bottom-5 right-5 w-24 h-24 bg-white rounded-full blur-2xl"></div>
            </div>
            
            <div className="relative text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                  {isProfileComplete ? (
                    <ThumbsUp className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  ) : (
                    <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  )}
                </div>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white drop-shadow-lg">
                {isProfileComplete ? "Thank You for Your Patience!" : "You're Almost There!"}
              </h3>
              <p className="text-sm md:text-base text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow">
                {isProfileComplete 
                  ? "We're working diligently to review your profile. Once verified, you'll join thousands of genuine individuals ready to find meaningful partnerships."
                  : "Thousands of authentic individuals are waiting to connect with someone like you. Complete your verification to join this meaningful community and begin your journey to finding true partnership."
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-2">
                {isProfileComplete ? (
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                    <Button
                      onClick={() => router.push("/dashboard/preferences")}
                      className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 text-sm md:text-base font-semibold"
                    >
                      Set Partner Preferences
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      onClick={() => router.push("/dashboard/referrals")}
                      variant="outline"
                      className="border-2 border-white/50 text-white hover:bg-white/20 bg-transparent backdrop-blur-sm text-sm md:text-base font-semibold"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Friends
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => router.push("/dashboard/settings")}
                    className="bg-white/20 hover:bg-white/30 text-white border-2 border-white/30 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 text-sm md:text-base font-semibold"
                  >
                    Complete My Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
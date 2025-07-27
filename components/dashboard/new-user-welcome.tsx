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
      <Card className="overflow-hidden border border-orange-200 shadow-xl bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="p-6 md:p-8">
          <div className="text-center space-y-6">
            {/* Welcome Header */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-r from-orange-200 to-amber-200 rounded-full blur opacity-40"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                    {isProfileComplete ? (
                      <CheckCircle className="w-8 h-8 text-white" />
                    ) : (
                      <Sparkles className="w-8 h-8 text-white" />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                  {isProfileComplete ? `Thank you, ${profile?.first_name}!` : `Welcome to DharmaSaathi, ${profile?.first_name}!`}
                </h1>
                <p className="text-sm md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  {isProfileComplete 
                    ? "Your profile is complete and ready for verification. We appreciate the time you've taken to provide detailed information about yourself."
                    : "Your journey to finding a meaningful life partner begins here. We're delighted to have you join our community of values-driven individuals."
                  }
                </p>
              </div>

              {/* Achievement Badges */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                <Badge className="bg-green-100 text-green-800 border border-green-200 px-2 md:px-3 py-1 text-xs md:text-sm">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Profile Created
                </Badge>
                {isProfileComplete && (
                  <Badge className="bg-green-100 text-green-800 border border-green-200 px-2 md:px-3 py-1 text-xs md:text-sm">
                    <ThumbsUp className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    Profile Complete
                  </Badge>
                )}
                <Badge className="bg-orange-100 text-orange-800 border border-orange-200 px-2 md:px-3 py-1 text-xs md:text-sm">
                  <Crown className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Community Member
                </Badge>
                <Badge className="bg-amber-100 text-amber-800 border border-amber-200 px-2 md:px-3 py-1 text-xs md:text-sm">
                  <Heart className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Seeking Partnership
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

          <div className="space-y-4 md:space-y-6">
            {/* Step 1: Profile Verification */}
            <div className="w-full bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-4 md:p-6">
              <div className="flex items-start gap-4 md:gap-6">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                    {isProfileComplete ? (
                      <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    ) : (
                      <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">
                      {isProfileComplete ? "Verification in Progress" : "Step 1: Profile Verification"}
                    </h3>
                    <Badge className="bg-orange-100 text-orange-800 border border-orange-200 text-xs w-fit">
                      {isProfileComplete ? "4-7 Business Days" : "In Progress"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    {isProfileComplete ? (
                      <>
                        <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                          Due to high volume of applications, our verification team is currently processing profiles within 4-7 business days. Thank you for your patience as we ensure quality and safety for all members.
                        </p>
                        
                        <div className="bg-white rounded-xl p-3 md:p-4 space-y-3 border border-orange-100">
                          <h4 className="text-sm md:text-base font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                            What's Happening Now:
                          </h4>
                          <div className="grid grid-cols-1 gap-2 md:gap-3 text-xs md:text-sm">
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0" />
                              <span>Your profile is in the verification queue</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Shield className="w-3 h-3 md:w-4 md:h-4 text-orange-600 flex-shrink-0" />
                              <span>Our team is reviewing your information</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-amber-600 flex-shrink-0" />
                              <span>You'll receive an email notification once verified</span>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                          Our verification process ensures a secure, authentic community where you can confidently connect with genuine individuals seeking meaningful relationships.
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
                              <span>Safe & secure environment</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3 md:w-4 md:h-4 text-orange-600 flex-shrink-0" />
                              <span>Authentic community members</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Shield className="w-3 h-3 md:w-4 md:h-4 text-amber-600 flex-shrink-0" />
                              <span>Values-aligned individuals</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Heart className="w-3 h-3 md:w-4 md:h-4 text-red-500 flex-shrink-0" />
                              <span>Serious relationship intent</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

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
                      
                      {isProfileComplete ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-800">Profile Complete!</span>
                          </div>
                          <p className="text-xs text-green-700">
                            Excellent! Your detailed profile helps us find the best matches for you.
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-gray-600">
                            Complete profiles get verified faster! Add photos, personal details, and preferences.
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
                      <h3 className="text-lg md:text-xl font-bold text-gray-900">Step 2: Discover Compatible Partners</h3>
                      <Badge className="bg-gray-100 text-gray-600 border border-gray-200 text-xs w-fit">Available after verification</Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                        Once verified, you'll access our intelligent matching system that connects you with compatible partners who share your values and relationship goals.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                        <div className="flex items-center gap-2">
                          <Star className="w-3 h-3 md:w-4 md:h-4 text-amber-600 flex-shrink-0" />
                          <span>AI-powered compatibility matching</span>
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

            {/* Tips for Finding Genuine Partners (shown only when profile is complete) */}
            {isProfileComplete && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 md:p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Star className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <h4 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Tips for Finding Your Genuine Partner</h4>
                    <p className="text-sm md:text-base text-gray-600">Make the most of your DharmaSaathi experience</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Eye className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 text-sm mb-1">Look Beyond Photos</h5>
                          <p className="text-xs text-gray-600">Read profiles thoroughly. Values, interests, and life goals matter more than appearance.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 text-sm mb-1">Start Meaningful Conversations</h5>
                          <p className="text-xs text-gray-600">Ask about their values, aspirations, and what they're truly seeking in a partner.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 text-sm mb-1">Take Your Time</h5>
                          <p className="text-xs text-gray-600">Build genuine connections. Quality conversations lead to lasting relationships.</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <UserCheck className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 text-sm mb-1">Trust Your Instincts</h5>
                          <p className="text-xs text-gray-600">If something feels off, it probably is. Genuine people are consistent and transparent.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pro Tip – Fast-track Your Verification (shown only when profile is not complete) */}
            {!isProfileComplete && (
              <div className="bg-gradient-to-r from-orange-100 to-amber-100 border-l-4 border-orange-500 rounded-lg p-4 md:p-5">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">💡</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-orange-800 mb-1 text-sm md:text-base">Pro Tip: Accelerate Your Verification</h5>
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
            )}
          </div>

          {/* Encouragement Footer */}
          <div className="mt-6 md:mt-8 p-4 md:p-6 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200">
            <div className="text-center space-y-3 md:space-y-4">
              <div className="flex justify-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                  {isProfileComplete ? (
                    <ThumbsUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  ) : (
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  )}
                </div>
              </div>
              <h3 className="text-base md:text-lg font-bold text-gray-900">
                {isProfileComplete ? "Thank You for Your Patience!" : "You're Almost There!"}
              </h3>
              <p className="text-sm md:text-base text-gray-700 max-w-2xl mx-auto">
                {isProfileComplete 
                  ? "We're working diligently to review your profile. Once verified, you'll join thousands of genuine individuals ready to find meaningful partnerships."
                  : "Thousands of authentic individuals are waiting to connect with someone like you. Complete your verification to join this meaningful community and begin your journey to finding true partnership."
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center pt-2">
                {isProfileComplete ? (
                  <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                    <Button
                      onClick={() => router.push("/dashboard/preferences")}
                      className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg transition-all duration-300 text-sm md:text-base"
                    >
                      Set Partner Preferences
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      onClick={() => router.push("/dashboard/referrals")}
                      variant="outline"
                      className="border-orange-400 text-orange-700 hover:bg-orange-200 text-sm md:text-base"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Friends
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => router.push("/dashboard/settings")}
                    className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg transition-all duration-300 text-sm md:text-base"
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
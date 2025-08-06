"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, MapPin, Calendar, Clock, Users, User } from "lucide-react"
import dynamic from "next/dynamic"
import { getAvatarInitials } from "@/lib/utils"
import ProfileModal from "@/components/profile-modal"

const WhoLikedYou = dynamic(() => import("@/components/dashboard/who-liked-you"), { ssr: false })
import { useQuery } from "@tanstack/react-query"

interface Match {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  last_message_at?: string
  other_user: {
    id: string
    first_name?: string
    last_name?: string
    profile_photo_url?: string
    user_photos?: string[]
    city?: { name: string }
    state?: { name: string }
    birthdate?: string
    gender?: string
    verification_status?: string
  }
}

export default function MatchesPage() {
  const { user, profile, loading, isVerified } = useAuthContext()
  const router = useRouter()
  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  const {
    data: matches = [],
    isLoading: matchesLoading,
    refetch: refetchMatches,
  } = useQuery({
    queryKey: ["matches"],
    queryFn: async () => {
      const res = await fetch("/api/profiles/matches?limit=10", { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch matches")
      const data = await res.json()
      return (data.matches || []).slice(0, 10)
    },
    enabled: isVerified,
  })

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/")
      return
    }
    if (!(profile as any)?.is_onboarded) {
      router.replace("/onboarding")
      return
    }
    if (isVerified) {
      refetchMatches()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, profile, isVerified])

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return null
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return "Today"
    } else if (diffDays === 2) {
      return "Yesterday"
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`
    } else {
      return date.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      })
    }
  }

  const handleViewProfile = (profile: any) => {
    setSelectedProfile(profile)
    setProfileModalOpen(true)
  }

  if (loading) {
    return <>{require("./loading").default()}</>;
  }

  return (
    <main className="pt-4 pb-24 min-h-screen bg-gradient-to-br from-pink-50 to-rose-50">
      <div className="px-3 sm:px-4 max-w-2xl mx-auto">
        {isVerified ? (
          // VERIFIED USER - Show Matches
          <>
            {/* Page Header */}
            <div className="text-center mb-6 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Matches</h2>
              <p className="text-gray-700">Discover meaningful connections with people who share your spiritual journey</p>
            </div>

            {matches.length === 0 ? (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
                <CardContent className="text-center py-12 px-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#8b0000] to-red-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">No matches yet</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Start swiping to find your spiritual life partner. 
                    When you both like each other, you'll match and can start chatting.
                  </p>
                  <Button 
                    onClick={() => router.push("/dashboard")} 
                    className="bg-[#8b0000] hover:bg-red-800 text-white px-8 py-2 rounded-full font-semibold shadow-lg"
                  >
                    Start Swiping
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {matches.map((match: Match) => (
                  <Card key={match.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-200 bg-white rounded-2xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4">
                        {/* Top Section - Avatar and Basic Info */}
                        <div className="flex items-start gap-3 mb-3">
                          <div 
                            className="relative cursor-pointer" 
                            onClick={() => handleViewProfile(match.other_user)}
                          >
                            <Avatar className="h-14 w-14 ring-2 ring-[#8b0000]/20">
                              <AvatarImage
                                src={
                                  match.other_user.profile_photo_url ||
                                  match.other_user.user_photos?.[0] ||
                                  "/placeholder-user.jpg"
                                }
                                className="object-cover"
                                style={{ objectPosition: '50% 20%' }}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-[#8b0000] to-red-700 text-white font-semibold">
                                {getAvatarInitials(match.other_user.first_name, match.other_user.last_name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 
                                className="font-bold text-gray-900 text-lg leading-tight truncate cursor-pointer hover:text-[#8b0000]"
                                onClick={() => handleViewProfile(match.other_user)}
                              >
                                {match.other_user.first_name} {match.other_user.last_name}
                              </h3>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                              {calculateAge(match.other_user.birthdate || "") && (
                                <span className="font-medium">{calculateAge(match.other_user.birthdate || "")} years</span>
                              )}
                              {match.other_user.gender && (
                                <span className="capitalize">{match.other_user.gender}</span>
                              )}
                            </div>

                            {match.other_user.city?.name && match.other_user.state?.name && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <MapPin className="w-3 h-3 text-[#8b0000]" />
                                <span className="truncate">{match.other_user.city.name}, {match.other_user.state.name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Match Info */}
                        <div className="mb-3 px-1">
                          <div className="text-sm text-gray-500">
                            You matched on {formatDate(match.created_at)}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => router.push(`/dashboard/messages/${match.id}`)}
                            className="flex-1 bg-gradient-to-r from-[#8b0000] to-red-700 hover:from-red-800 hover:to-red-900 text-white font-semibold rounded-xl py-2.5 shadow-sm"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleViewProfile(match.other_user)}
                            className="border-[#8b0000] text-[#8b0000] hover:bg-[#8b0000] hover:text-white rounded-xl py-2.5 px-4"
                          >
                            Profile
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Who Liked You Section */}
            <div className="mt-8 mb-6">
              <WhoLikedYou userProfile={profile} />
            </div>
          </>
        ) : (
          // UNVERIFIED USER - Show verification required
          <>


            {/* Verification Required Notice */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <CardContent className="text-center py-12 px-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#8b0000] to-red-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Verification Required</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Your profile is being reviewed. Once verified, you'll be able to view matches and start meaningful conversations.
                </p>
                <Button 
                  onClick={() => router.push("/dashboard")} 
                  className="bg-[#8b0000] hover:bg-red-800 text-white px-8 py-2 rounded-full font-semibold shadow-lg"
                >
                  Check Verification Status
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
        />
      )}
    </main>
  )
}
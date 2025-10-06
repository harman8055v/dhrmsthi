"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, MapPin, Calendar, Clock, Users, User, Sparkles, ShieldCheck, Camera, Pencil } from "lucide-react"
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
  const [search, setSearch] = useState("")

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

  const filteredMatches = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return matches
    return matches.filter((m: Match) => {
      const name = `${m.other_user.first_name || ""} ${m.other_user.last_name || ""}`.toLowerCase()
      const city = (m.other_user.city?.name || "").toLowerCase()
      const state = (m.other_user.state?.name || "").toLowerCase()
      return name.includes(term) || city.includes(term) || state.includes(term)
    })
  }, [search, matches])

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
    <main className="relative pt-4 pb-24 min-h-screen bg-gradient-to-br from-rose-50 via-rose-100 to-rose-200 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent pointer-events-none" />
      <div className="px-3 sm:px-4 max-w-2xl mx-auto relative z-10">
        {isVerified ? (
          // VERIFIED USER - Show Matches
          <>
            <div className="mb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search matches by name or location..."
                className="w-full h-10 rounded-full border border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b0000]/20 focus:border-[#8b0000] bg-white/95"
              />
            </div>
            

            {filteredMatches.length === 0 ? (
              <Card className="border border-rose-100 shadow-sm bg-white/95 backdrop-blur rounded-2xl">
                <CardContent className="text-center py-12 px-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#8b0000] to-red-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Heart className="w-10 h-10 text-white" />
                  </div>
                  {search.trim() ? (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">No results</h3>
                      <p className="text-gray-600">Try a different name or location.</p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">No matches yet</h3>
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        Start swiping to find your spiritual life partner. 
                        When you both like each other, you'll match and can start chatting.
                      </p>
                      <Button 
                        onClick={() => router.push("/dashboard")} 
                        className="bg-[#8b0000] hover:bg-[#7a0000] text-white px-8 py-3 rounded-full font-semibold shadow-md"
                      >
                        Start Swiping
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredMatches.map((match: Match) => (
                  <Card key={match.id} className="border border-rose-100/70 bg-white/95 backdrop-blur rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="p-5">
                        {/* Top Section - Avatar and Basic Info */}
                        <div className="flex items-start gap-4 mb-3">
                          <div 
                            className="relative cursor-pointer" 
                            onClick={() => handleViewProfile(match.other_user)}
                          >
                            <Avatar className="h-14 w-14 ring-1 ring-[#8b0000]/30 shadow-sm">
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
                              {match.other_user.verification_status === 'verified' && (
                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 text-xs font-medium">Verified</Badge>
                              )}
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
                            className="flex-1 bg-gradient-to-r from-[#8b0000] to-red-700 hover:from-red-800 hover:to-red-900 text-white font-semibold rounded-full py-3 shadow-sm"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleViewProfile(match.other_user)}
                            className="border-[#8b0000] text-[#8b0000] hover:bg-[#8b0000] hover:text-white rounded-full py-3 px-5"
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
            <Card className="border border-rose-100 shadow-sm bg-white/95 backdrop-blur rounded-2xl">
              <CardContent className="text-center py-12 px-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#8b0000] to-red-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Verification Required</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Your profile is being reviewed. Once verified, you'll be able to view matches and start meaningful conversations.
                </p>
                <Button 
                  onClick={() => router.push("/dashboard")} 
                  className="bg-[#8b0000] hover:bg-[#7a0000] text-white px-8 py-3 rounded-full font-semibold shadow-md"
                >
                  Check Verification Status
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Quality Matches Tips – render for all users */}
        <section className="mt-10">
          <Card className="border border-rose-100 shadow-sm bg-white/95 backdrop-blur rounded-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#8b0000] via-rose-500 to-orange-400" />
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-[#8b0000]">
                  <Sparkles className="w-4 h-4" />
                </span>
                Get higher‑quality matches
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Photos */}
                <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-[#8b0000]">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Add 3–5 clear photos</div>
                      <p className="text-sm text-gray-600 mt-0.5">Well‑lit, recent, and smiling photos get 2–3× more likes.</p>
                    </div>
                  </div>
                </div>

                {/* Bio & Values */}
                <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-[#8b0000]">
                      <Pencil className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Share your values</div>
                      <p className="text-sm text-gray-600 mt-0.5">Write a warm bio. Mention your path, daily practices, and what you’re seeking.</p>
                    </div>
                  </div>
                </div>

                {/* Verification */}
                <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Get verified</div>
                      <p className="text-sm text-gray-600 mt-0.5">Verified profiles receive more attention and faster replies.</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-[#8b0000]">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Keep location current</div>
                      <p className="text-sm text-gray-600 mt-0.5">Accurate city/state helps match you with nearby, compatible users.</p>
                    </div>
                  </div>
                </div>

                {/* Messaging */}
                <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-[#8b0000]">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Send thoughtful openers</div>
                      <p className="text-sm text-gray-600 mt-0.5">Refer to something in their profile. Aim to reply within 24 hours.</p>
                    </div>
                  </div>
                </div>

                {/* Patience */}
                <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-[#8b0000]">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Quality takes time</div>
                      <p className="text-sm text-gray-600 mt-0.5">We verify new profiles daily. Consistency wins over quantity.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center">
                <Button
                  onClick={() => router.push("/dashboard/profile")}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-[#8b0000] to-red-700 hover:from-red-800 hover:to-red-900 text-white font-semibold shadow-sm"
                >
                  Improve my profile
                </Button>
              </div>

              <div className="mt-3 text-center text-xs text-gray-500">
                Let your authenticity shine — the right connections will follow <Heart className="inline w-3 h-3 ml-1 text-rose-500" />
              </div>
            </CardContent>
          </Card>
        </section>
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
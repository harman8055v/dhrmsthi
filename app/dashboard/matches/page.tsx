"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, MapPin, Calendar, Clock, Shield, Users, User } from "lucide-react"
import MobileNav from "@/components/dashboard/mobile-nav"
import WhoLikedYou from "@/components/dashboard/who-liked-you"
import { isUserVerified } from "@/lib/utils"
import type { User as SupabaseUser } from "@supabase/supabase-js"

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
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

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
          console.error("Error fetching user profile:", error)
          return
        }

        setProfile(profileData)

        // Only fetch matches if user is verified
        if (isUserVerified(profileData)) {
          fetchMatches()
        }

        setLoading(false)
      } catch (error) {
        console.error("Error in auth check:", error)
        router.push("/")
      }
    }

    getUser()
  }, [router])

  const fetchMatches = async () => {
    try {
      const response = await fetch("/api/profiles/matches", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches || [])
      }
    } catch (error) {
      console.error("Error fetching matches:", error)
    }
  }

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

  if (loading) {
    return <>{require("./loading").default()}</>;
  }

  const isVerified = isUserVerified(profile)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <MobileNav userProfile={profile} />

      <main className="pt-20 pb-32 min-h-screen">
        <div className="px-4 max-w-4xl mx-auto">
          {isVerified ? (
            // VERIFIED USER - Show Matches
            <>
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900 mb-1">Your Matches</h1>
                <p className="text-sm text-gray-600">Discover compatible souls on the same spiritual journey</p>
              </div>

              {/* Who Liked You Section */}
              <div className="mb-8">
                <WhoLikedYou userProfile={profile} />
              </div>

              {/* Mutual Matches Section */}
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Mutual Matches</h2>
                <p className="text-sm text-gray-600">People you've both liked each other</p>
              </div>
              
              {matches.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No mutual matches yet</h3>
                    <p className="text-gray-600 mb-6">
                      Check who's already liked you above, or start swiping to find your spiritual life partner. 
                      Your mutual matches will appear here.
                    </p>
                    <Button onClick={() => router.push("/dashboard")} className="bg-orange-600 hover:bg-orange-700">
                      Start Swiping
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <Card key={match.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage
                              src={
                                match.other_user.profile_photo_url ||
                                match.other_user.user_photos?.[0] ||
                                "/placeholder-user.jpg"
                              }
                            />
                            <AvatarFallback>
                              {match.other_user.first_name?.[0] || "U"}
                              {match.other_user.last_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {match.other_user.first_name} {match.other_user.last_name}
                              </h3>
                              {match.other_user.verification_status === "verified" && (
                                <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              {calculateAge(match.other_user.birthdate || "") && (
                                <span>{calculateAge(match.other_user.birthdate || "")} years</span>
                              )}
                              {match.other_user.gender && <span>{match.other_user.gender}</span>}
                              {match.other_user.city?.name && match.other_user.state?.name && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {match.other_user.city.name}, {match.other_user.state.name}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>Matched {formatDate(match.created_at)}</span>
                              {match.last_message_at && (
                                <>
                                  <span>•</span>
                                  <Clock className="w-3 h-3" />
                                  <span>Last message {formatDate(match.last_message_at)}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              onClick={() => router.push(`/dashboard/messages?match=${match.id}`)}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Message
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/dashboard/profile/${match.other_user.id}`)}
                            >
                              <User className="w-4 h-4 mr-2" />
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            // UNVERIFIED USER - Show Verification Required Notice
            <>
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900 mb-1">Your Matches</h1>
                <p className="text-sm text-gray-600">Discover compatible souls on the same spiritual journey</p>
              </div>

              {/* Verification Required Notice */}
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Matches Available After Verification</h3>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      Your profile is currently under review. Once verified, you'll be able to see and connect with
                      compatible spiritual partners in our community.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={() => router.push("/dashboard")}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Check Verification Status
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/dashboard/settings")}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        Complete Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, MapPin, Calendar, Clock, Shield, Users, Heart } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
// isUserVerified no longer needed because we get isVerified from context

interface Conversation {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  last_message_at?: string
  last_message_text?: string
  unread_count?: number
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

export default function MessagesPage() {
  const { user, profile, loading, isVerified } = useAuthContext()
  const {
    data: conversations = [],
    isLoading: convLoading,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/messages/conversations?limit=10", { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch conversations")
      const data = await res.json()
      return (data.conversations || []).slice(0, 10)
    },
    enabled: isVerified,
  })
  const router = useRouter()

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
      refetchConversations()
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

  if (loading) {
    return <>{require("./loading").default()}</>;
  }

  return (
      <main className="pt-20 pb-32 min-h-screen">
        <div className="px-4 max-w-4xl mx-auto">
          {isVerified ? (
            // VERIFIED USER - Show Messages
            <>
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-xl font-semibold text-gray-900 mb-1">Messages</h1>
                <p className="text-sm text-gray-600">Connect with your spiritual matches</p>
              </div>

              {/* Conversations List */}
              {conversations.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No conversations yet</h3>
                    <p className="text-gray-600 mb-6">
                      Start swiping and matching to begin meaningful conversations with your spiritual life partner.
                    </p>
                    <Button onClick={() => router.push("/dashboard")} className="bg-orange-600 hover:bg-orange-700">
                      Start Swiping
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {conversations.map((conversation: Conversation) => (
                    <Card key={conversation.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage
                              src={
                                conversation.other_user.profile_photo_url ||
                                conversation.other_user.user_photos?.[0] ||
                                "/placeholder-user.jpg"
                              }
                            />
                            <AvatarFallback>
                              {conversation.other_user.first_name?.[0] || "U"}
                              {conversation.other_user.last_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {conversation.other_user.first_name} {conversation.other_user.last_name}
                              </h3>
                              {conversation.other_user.verification_status === "verified" && (
                                <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                              )}
                              {conversation.unread_count && conversation.unread_count > 0 && (
                                <Badge className="bg-red-100 text-red-800 text-xs">{conversation.unread_count}</Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              {calculateAge(conversation.other_user.birthdate || "") && (
                                <span>{calculateAge(conversation.other_user.birthdate || "")} years</span>
                              )}
                              {conversation.other_user.gender && <span>{conversation.other_user.gender}</span>}
                              {conversation.other_user.city?.name && conversation.other_user.state?.name && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {conversation.other_user.city.name}, {conversation.other_user.state.name}
                                </span>
                              )}
                            </div>

                            {conversation.last_message_text && (
                              <p className="text-sm text-gray-700 mb-2 line-clamp-1">{conversation.last_message_text}</p>
                            )}

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>Started {formatDate(conversation.created_at)}</span>
                              {conversation.last_message_at && (
                                <>
                                  <span>•</span>
                                  <Clock className="w-3 h-3" />
                                  <span>Last message {formatDate(conversation.last_message_at)}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              onClick={() => router.push(`/dashboard/messages/${conversation.id}`)}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Chat
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
                <h1 className="text-xl font-semibold text-gray-900 mb-1">Messages</h1>
                <p className="text-sm text-gray-600">Connect with your spiritual matches</p>
              </div>

              {/* Verification Required Notice */}
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Messages Available After Verification</h3>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      Once your profile is verified, you'll be able to send and receive messages from your matches.
                      Start meaningful conversations with compatible spiritual partners.
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
                        onClick={() => router.push("/dashboard/matches")}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        View Matches
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
  )
}

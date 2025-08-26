"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Crown, Sparkles } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getAvatarInitials } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

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
    data: conversationsResponse,
    isLoading: convLoading,
    refetch: refetchConversations,
    error: conversationsError,
  } = useQuery({
    queryKey: ["conversations", "list"],
    queryFn: async () => {
      const res = await fetch("/api/messages/conversations?limit=20", { 
        credentials: "include",
        // Add cache headers for better performance
        headers: {
          'Cache-Control': 'max-age=60',
        }
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to fetch conversations: ${res.status}`)
      }
      const data = await res.json()
      return data
    },
    enabled: isVerified && !loading,
    retry: 1,
    retryDelay: 500,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if data exists in cache
  })

  // Safely extract conversations array with robust error handling
  const conversations: Conversation[] = (() => {
    try {
      if (!conversationsResponse) return []
      
      // Handle different possible response structures
      if (Array.isArray(conversationsResponse)) {
        return conversationsResponse
      }
      
      if ((conversationsResponse as any).conversations && Array.isArray((conversationsResponse as any).conversations)) {
        return (conversationsResponse as any).conversations
      }
      
      console.warn('[Messages] Unexpected conversations response structure:', conversationsResponse)
      return []
    } catch (error) {
      console.error('[Messages] Error processing conversations data:', error)
      return []
    }
  })()
  const router = useRouter()

  // Check if user has premium access to messaging
  const hasMessagingAccess = profile?.account_status && ['sparsh', 'sangam', 'samarpan'].includes(profile.account_status)

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

  // Refresh conversations when user returns to this page (e.g., after reading messages)
  useEffect(() => {
    const handleFocus = () => {
      if (isVerified) {
        console.log('[Messages] Page focused - refreshing conversations')
        refetchConversations()
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && isVerified) {
        console.log('[Messages] Page visible - refreshing conversations') 
        refetchConversations()
      }
    }

    // Refresh when window gets focus or becomes visible
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isVerified, refetchConversations])

  // Real-time subscription to update conversations in real-time
  useEffect(() => {
    if (!user || !isVerified) return

    // console.log('[Messages] Setting up real-time subscription for messages and matches')
    
    const channel = supabase
      .channel(`conversations_updates_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `read_at=not.is.null`
        },
        (payload) => {
          console.log('[Messages] 📖 Message marked as read - refreshing conversations')
          console.log('[Messages] Payload:', payload)
          refetchConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public', 
          table: 'messages'
        },
        (payload) => {
          console.log('[Messages] 📩 New message received - refreshing conversations')
          console.log('[Messages] New message payload:', payload.new)
          refetchConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `last_message_at=not.is.null`
        },
        (payload) => {
          console.log('[Messages] 🔄 Match last_message_at updated - refreshing conversations')
          console.log('[Messages] Match update payload:', payload.new)
          refetchConversations()
        }
      )
      .subscribe()

    return () => {
      // console.log('[Messages] Cleaning up real-time subscription')
      channel.unsubscribe()
    }
  }, [user, isVerified, refetchConversations])

  // Listen for messages being marked as read from chat pages
  useEffect(() => {
    const handleMessagesMarkedAsRead = (event: CustomEvent) => {
      console.log('[Messages] 🎉 Messages marked as read event received:', event.detail)
      if (isVerified) {
        // Small delay to ensure database is updated
        setTimeout(() => {
          console.log('[Messages] 🔄 Refreshing conversations after messages marked as read...')
          // Force refresh by invalidating cache and refetching
          refetchConversations().then(() => {
            console.log('[Messages] ✅ Conversations refreshed successfully')
            // Also force a second refresh after a short delay to ensure data is fresh
            setTimeout(() => {
              console.log('[Messages] 🔄 Double-checking with second refresh...')
              refetchConversations()
            }, 500)
          }).catch((error) => {
            console.error('[Messages] ❌ Error refreshing conversations:', error)
          })
        }, 200)
      } else {
        console.log('[Messages] ❌ User not verified, skipping refresh')
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead as EventListener)
      return () => {
        window.removeEventListener('messagesMarkedAsRead', handleMessagesMarkedAsRead as EventListener)
      }
    }
  }, [isVerified, refetchConversations])

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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
  }

  if (loading) {
    return <>{require("./loading").default()}</>
  }

  return (
    <main className="pt-4 pb-24 min-h-screen bg-gradient-to-br from-pink-50 to-rose-50">
      <div className="px-3 sm:px-4 max-w-2xl mx-auto">
        {!isVerified ? (
          <>


            {/* Verification Required Notice */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16 px-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#8b0000] to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Messages Available After Verification</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Once your profile is verified, you'll be able to send and receive messages from your matches.
                Start meaningful conversations with compatible spiritual partners.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full bg-[#8b0000] hover:bg-red-800 text-white py-3 rounded-xl font-semibold"
                >
                  Check Verification Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/matches")}
                  className="w-full border-[#8b0000] text-[#8b0000] hover:bg-[#8b0000] hover:text-white py-3 rounded-xl font-semibold"
                >
                  View Matches
                </Button>
              </div>
            </div>
          </>
        ) : !hasMessagingAccess ? (
          <>


            {/* Upgrade Required Notice */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16 px-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#8b0000] to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Unlock Messaging</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Start meaningful conversations with your spiritual matches! Upgrade to Sparsh Plan or higher to send and receive unlimited messages.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/dashboard/store")}
                  className="w-full bg-gradient-to-r from-[#8b0000] to-red-700 hover:from-red-800 hover:to-red-900 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Upgrade to Sparsh Plan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/matches")}
                  className="w-full border-[#8b0000] text-[#8b0000] hover:bg-[#8b0000] hover:text-white py-3 rounded-xl font-semibold"
                >
                  View Matches
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Page Header */}
            <div className="text-center mb-6 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Conversations</h2>
              <p className="text-gray-700">Connect with your spiritual matches and start meaningful conversations</p>
            </div>

            {/* Messages List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {conversationsError ? (
                <div className="text-center py-12 px-6">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Unable to load conversations</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    We're having trouble loading your conversations. Please check your connection and try again.
                  </p>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => refetchConversations()} 
                      className="bg-[#8b0000] hover:bg-red-800 text-white px-8 py-2 rounded-full font-semibold shadow-lg"
                      disabled={convLoading}
                    >
                      {convLoading ? "Retrying..." : "Try Again"}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => router.push("/dashboard")} 
                      className="border-[#8b0000] text-[#8b0000] hover:bg-[#8b0000] hover:text-white px-8 py-2 rounded-full font-semibold"
                    >
                      Go to Dashboard
                    </Button>
                  </div>
                </div>
              ) : convLoading ? (
                <div className="text-center py-12 px-6">
                  {/* Simple spiritual loader */}
                  <div className="relative w-12 h-12 mx-auto mb-4">
                    <div className="absolute inset-0 animate-spin">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1.5 h-1.5 bg-[#8b0000] rounded-full"
                          style={{
                            top: '50%',
                            left: '50%',
                            transform: `rotate(${i * 45}deg) translateX(20px) translateY(-50%)`,
                            opacity: 0.3 + (i * 0.1)
                          }}
                        />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-[#8b0000] rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-gray-600">Loading conversations...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#8b0000] to-red-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">No conversations yet</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Start swiping and matching to begin meaningful conversations with your spiritual life partner.
                  </p>
                  <Button 
                    onClick={() => router.push("/dashboard")} 
                    className="bg-[#8b0000] hover:bg-red-800 text-white px-8 py-2 rounded-full font-semibold shadow-lg"
                  >
                    Start Swiping
                  </Button>
                </div>
              ) : (
                <div>
                  {Array.isArray(conversations) && conversations.map((conversation: Conversation) => (
                    <div 
                      key={conversation.id} 
                      className="bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => router.push(`/dashboard/messages/${conversation.id}`)}
                    >
                      <div className="flex items-center gap-3 p-4">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={
                                conversation.other_user.profile_photo_url ||
                                conversation.other_user.user_photos?.[0] ||
                                "/placeholder-user.jpg"
                              }
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-gradient-to-br from-[#8b0000] to-red-700 text-white font-semibold text-sm">
                              {getAvatarInitials(conversation.other_user.first_name, conversation.other_user.last_name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Top Row: Name and Time */}
                          <div className="flex items-center justify-between mb-0.5">
                            <h3 className="font-semibold text-gray-900 text-base truncate">
                              {conversation.other_user.first_name} {conversation.other_user.last_name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(conversation.last_message_at || conversation.created_at)}
                              </span>
                              {(conversation.unread_count || 0) > 0 && (
                                <div className="bg-[#8b0000] text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                                  {conversation.unread_count! > 99 ? '99+' : conversation.unread_count}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Bottom Row: Message Preview */}
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 truncate flex-1">
                              {conversation.last_message_text || "You matched! Say hello 👋"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

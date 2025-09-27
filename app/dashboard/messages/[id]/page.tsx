"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import { useMessages } from "@/hooks/use-messages"
import { messagingBridge } from "@/lib/webview-messaging-bridge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Send, MoreVertical, Flag, UserX, X, MessageCircle } from "lucide-react"
import { getAvatarInitials } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import ProfileModal from "@/components/profile-modal"
import "@/styles/native-messaging.css"
import { matchService } from "@/lib/data-service"

interface Match {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  other_user: any // Using any to match the full profile structure from matchService
}

export default function ChatPage() {
  const { user, profile, loading, isVerified } = useAuthContext()
  const router = useRouter()
  const params = useParams()
  const matchId = params.id as string
  
  const [messageText, setMessageText] = useState("")
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [showUnmatchDialog, setShowUnmatchDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const markAsReadTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Check if user has premium access to messaging
  const hasMessagingAccess = profile?.account_status && ['sparsh', 'sangam', 'samarpan'].includes(profile.account_status)
  
  // Get match details - lightweight, fetch only this match and other user's profile
  const { data: matchData, isLoading: matchLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      return await matchService.getMatchWithProfile(matchId)
    },
    enabled: !!(isVerified && matchId),
    staleTime: 5 * 60 * 1000,
  })

  // Normalize to existing Match shape with other_user for UI
  const match: Match | null = useMemo(() => {
    if (!matchData) return null
    const { match, otherUser } = matchData
    return {
      id: match.id,
      user1_id: match.user1_id,
      user2_id: match.user2_id,
      created_at: match.created_at,
      other_user: otherUser, // Pass the complete otherUser object
    }
  }, [matchData])

  const { 
    messages, 
    loading: messagesLoading, 
    error: messagesError, 
    sending, 
    sendMessage,
    markMessagesAsRead 
  } = useMessages(matchId)

  // Mark messages as read when chat is viewed/focused - only after match is loaded
  useEffect(() => {
    if (!match || matchLoading) return

    const markAsReadDelayed = () => {
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current)
      }
      markAsReadTimeoutRef.current = setTimeout(() => {
        console.log('[Chat] Marking messages as read on focus')
        markMessagesAsRead()
      }, 1000) // 1 second delay to ensure user is actually viewing
    }

    const handleFocus = () => {
      if (matchId) markAsReadDelayed()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden && matchId) markAsReadDelayed()
    }

    // Mark as read when initially viewing and on focus events
    if (matchId) markAsReadDelayed()
    
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current)
      }
    }
  }, [matchId, markMessagesAsRead, match, matchLoading])

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
    if (!isVerified) {
      router.replace("/dashboard/messages")
      return
    }
  }, [loading, user, profile, isVerified, router])

  // Show loading state while both match and messages are loading
  const isInitialLoading = matchLoading || (messagesLoading && messages.length === 0)



  // Define scrollToBottom function with instant option
  const scrollToBottom = useCallback((instant = false) => {
    // Scroll to bottom - instantly for initial load, smooth for new messages
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: instant ? 'instant' : 'smooth', 
        block: 'end' 
      })
    }
    // Also try scrolling the container directly as fallback
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [])

  // Auto-scroll to bottom when messages first load or new messages arrive
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false)
  
  useEffect(() => {
    if (messages.length > 0) {
      if (!hasInitiallyScrolled) {
        // First load - scroll instantly to bottom (no animation)
        setTimeout(() => {
          scrollToBottom(true)
          setHasInitiallyScrolled(true)
        }, 0)
      } else {
        // New message - smooth scroll only if user is near bottom
        if (scrollContainerRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
          const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
          
          if (isNearBottom) {
            scrollToBottom(false)
          }
        }
      }
    }
  }, [messages.length, scrollToBottom, hasInitiallyScrolled])

  // Track scroll position for dynamic behaviors
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      const maxScroll = scrollHeight - clientHeight
      messagingBridge.updateScrollPosition(scrollTop, maxScroll)
    }
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || sending) return

    const messageToSend = messageText.trim()
    
    // Clear input immediately for instant feedback
    setMessageText("")
    
    try {
      const success = await sendMessage(messageToSend)
      if (success) {
        // Auto-focus input after successful send (native-like behavior)
        setTimeout(() => {
          inputRef.current?.focus()
          // Keep keyboard visible on mobile
          if (messagingBridge.isNative) {
            messagingBridge.toggleKeyboard(true)
          }
        }, 50)
        
        // Smooth scroll to bottom after sending
        setTimeout(() => scrollToBottom(false), 50)
      } else {
        // Restore message on failure
        setMessageText(messageToSend)
        messagingBridge.hapticFeedback('error')
        messagingBridge.playSound('error')
        toast.error("Failed to send message. Please try again.")
      }
    } catch (error) {
      // Restore message on error
      setMessageText(messageToSend)
      messagingBridge.hapticFeedback('error')
      messagingBridge.playSound('error')
      toast.error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleReport = async () => {
    if (!match?.other_user.id) return
    
    setActionLoading(true)
    try {
      console.log('[Chat] Reporting user:', match.other_user.id)
      const response = await fetch('/api/messages/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reported_user_id: match.other_user.id,
          reason: 'Inappropriate behavior - reported from chat conversation'
        })
      })

      const result = await response.json()
      console.log('[Chat] Report API response:', { status: response.status, result })

      if (response.ok) {
        toast.success("User reported successfully")
        setShowReportDialog(false)
      } else {
        const errorMessage = result?.message || result?.error || "Failed to report user"
        console.error('[Chat] Report failed:', errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('[Chat] Report error:', error)
      toast.error(`Failed to report user: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBlock = async () => {
    if (!match?.other_user.id) return
    
    setActionLoading(true)
    try {
      console.log('[Chat] Blocking user:', match.other_user.id)
      const response = await fetch('/api/messages/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          blocked_user_id: match.other_user.id
        })
      })

      const result = await response.json()
      console.log('[Chat] Block API response:', { status: response.status, result })

      if (response.ok) {
        toast.success("User blocked successfully")
        setShowBlockDialog(false)
        router.push('/dashboard/messages')
      } else {
        const errorMessage = result?.message || result?.error || "Failed to block user"
        console.error('[Chat] Block failed:', errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('[Chat] Block error:', error)
      toast.error(`Failed to block user: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnmatch = async () => {
    if (!matchId) return
    
    setActionLoading(true)
    try {
      const response = await fetch('/api/messages/unmatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          match_id: matchId
        })
      })

      if (response.ok) {
        toast.success("Unmatched successfully")
        setShowUnmatchDialog(false)
        router.push('/dashboard/messages')
      } else {
        toast.error("Failed to unmatch")
      }
    } catch (error) {
      console.error('Unmatch error:', error)
      toast.error("Failed to unmatch")
    } finally {
      setActionLoading(false)
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    return date.toLocaleDateString("en-IN", { 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getActiveStatus = () => {
    if (!match?.other_user.id) return "Active now"
    
    // Simple algorithm: use user ID to determine status
    const userId = match.other_user.id
    const hash = userId.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)
    
    // 60% chance of being "Active now", 40% chance of "Last seen"
    if (hash % 5 === 0 || hash % 5 === 1) {
      // Show "Last seen" with varying times
      const minutes = (hash % 60) + 1 // 1-60 minutes ago
      if (minutes < 60) {
        return `Last seen ${minutes}m ago`
      }
    }
    
    return "Active now"
  }

  if (loading || isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-rose-50/50">
        <div className="text-center">
          {/* Elegant lotus-inspired loader */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            {/* Breathing circle background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#8b0000]/10 to-orange-300/10 rounded-full animate-pulse"></div>
            
            {/* Rotating lotus petals */}
            <div className="absolute inset-2 animate-spin">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-gradient-to-br from-[#8b0000] to-orange-500 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 45}deg) translateX(24px) translateY(-50%)`,
                    opacity: 0.4 + (i * 0.075)
                  }}
                />
              ))}
            </div>
            
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-gradient-to-br from-[#8b0000] to-orange-500 rounded-full"></div>
            </div>
          </div>
          
          <h3 className="text-lg font-medium text-gray-800 mb-1">Opening conversation</h3>
          <p className="text-sm text-gray-500">
            Connecting with {match?.other_user?.first_name || 'your match'}...
          </p>
          

        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Conversation not found</h1>
        <p className="text-gray-600 mb-4">This conversation may have been deleted or doesn't exist.</p>
        <Button onClick={() => router.push("/dashboard/messages")} className="bg-[#8b0000] hover:bg-red-800">
          Back to Messages
        </Button>
      </div>
    )
  }

  if (!hasMessagingAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-[#8b0000] to-red-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Upgrade Required</h1>
          <p className="text-gray-600 mb-6 leading-relaxed">
            To send and receive messages, upgrade to Sparsh Plan or higher for unlimited messaging with your spiritual matches.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push("/dashboard/store")}
              className="w-full bg-gradient-to-r from-[#8b0000] to-red-700 hover:from-red-800 hover:to-red-900 text-white py-3 rounded-xl font-semibold"
            >
              Upgrade Now
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/messages")}
              className="w-full border-[#8b0000] text-[#8b0000] hover:bg-[#8b0000] hover:text-white py-3 rounded-xl font-semibold"
            >
              Back to Messages
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 fixed inset-0 z-40 disable-pull-refresh"
         style={{ 
           paddingBottom: 'env(safe-area-inset-bottom)',
           height: '100vh',
           maxHeight: '100vh'
         }}>
      
      {/* Premium Chat Header - Fixed */}
      <div className="flex-shrink-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 px-4 py-4 shadow-lg shadow-gray-900/5">
        <div className="flex items-center gap-3">
          {/* Premium Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              try {
                router.back()
              } catch (error) {
                console.error("Navigation error:", error)
                // Fallback to messages page
                window.location.href = "/dashboard/messages"
              }
            }}
            className="p-2.5 hover:bg-gray-100/80 rounded-full -ml-1 transition-all duration-200 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Button>
          
          {/* Premium User Info */}
          <div 
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:bg-gray-50/50 rounded-xl p-2 -m-2 transition-all duration-200"
            onClick={() => setProfileModalOpen(true)}
          >
            <div className="relative flex-shrink-0">
              <Avatar className="h-11 w-11 ring-2 ring-white shadow-lg">
                <AvatarImage
                  src={
                    match.other_user.profile_photo_url ||
                    match.other_user.user_photos?.[0] ||
                    "/placeholder-user.jpg"
                  }
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-[#8b0000] to-red-700 text-white font-semibold text-sm">
                  {getAvatarInitials(match.other_user.first_name, match.other_user.last_name)}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 text-base truncate">
                {match.other_user.first_name} {match.other_user.last_name}
              </h2>
              <p className="text-xs truncate text-green-600 font-medium">
                Active now
              </p>
            </div>
          </div>


          
                                          {/* Premium Options Menu */}
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2.5 hover:bg-gray-100/80 rounded-full transition-all duration-200 active:scale-95">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-xl">
               <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-red-600 focus:text-red-600 hover:bg-red-50/80 rounded-lg m-1">
                 <Flag className="w-4 h-4 mr-2" />
                 Report User
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => setShowBlockDialog(true)} className="text-red-600 focus:text-red-600 hover:bg-red-50/80 rounded-lg m-1">
                 <UserX className="w-4 h-4 mr-2" />
                 Block User
               </DropdownMenuItem>
               <DropdownMenuSeparator className="bg-gray-200/50" />
               <DropdownMenuItem onClick={() => setShowUnmatchDialog(true)} className="text-red-600 focus:text-red-600 hover:bg-red-50/80 rounded-lg m-1">
                 <X className="w-4 h-4 mr-2" />
                 Unmatch
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </div>

      {/* Premium Messages Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-3 pb-32 bg-gradient-to-b from-transparent via-gray-50/30 to-transparent"
        onScroll={handleScroll}>
        {messagesLoading && messages.length === 0 ? (
          <div className="text-center py-12">
            {/* Elegant spiritual loader */}
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 animate-spin">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-gradient-to-br from-[#8b0000] to-orange-400 rounded-full"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `rotate(${i * 60}deg) translateX(16px) translateY(-50%)`,
                      opacity: 0.3 + (i * 0.1)
                    }}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#8b0000] rounded-full"></div>
              </div>
            </div>
            <p className="text-gray-600 font-medium">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#8b0000] to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start the conversation</h3>
            <p className="text-gray-600 mb-4 px-4">
              You matched with {match.other_user.first_name}! Send a message to begin your spiritual journey together.
            </p>
            <div 
              className="bg-gradient-to-r from-[#8b0000]/5 to-red-50 rounded-lg p-4 max-w-sm mx-auto cursor-pointer hover:bg-red-50 transition-colors"
              onClick={() => setMessageText("Namaste! I'd love to learn more about your spiritual journey.")}
            >
              <p className="text-sm text-[#8b0000] font-medium">
                💫 "Namaste! I'd love to learn more about your spiritual journey."
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            return (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'} message-animate-in group`}
              style={{ animationDelay: `${index * 0.02}s` }}
            >
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2.5 rounded-2xl message-bubble message-interactive relative ${
                  message.sender_id === user?.id
                    ? 'bg-gradient-to-br from-purple-50 via-white to-purple-50 text-gray-800 shadow-sm shadow-purple-900/5 border border-purple-200/20'
                    : 'bg-gradient-to-br from-[#8b0000] via-red-600 to-orange-600 text-white shadow-md shadow-red-900/15'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <div className={`flex items-center gap-1 mt-1.5 ${
                  message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                }`}>
                  <span className={`text-[10px] ${
                    message.sender_id === user?.id ? 'text-gray-400' : 'text-white/60'
                  }`}>
                    {formatMessageTime(message.created_at)}
                  </span>
                  {message.sender_id === user?.id && (
                    <span className={`text-[10px] ml-0.5 ${
                      message.read_at ? 'text-blue-500' : 'text-gray-400'
                    }`}>
                      {message.read_at ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
                
                {/* Premium message glow effect */}
                {message.sender_id !== user?.id && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-bl-lg"></div>
                )}
              </div>
            </div>
            )
          })
        )}
        {/* Scroll anchor point */}
        <div ref={messagesEndRef} style={{ height: '1px' }} />
      </div>

      {/* Error Display */}
      {messagesError && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{messagesError}</p>
        </div>
      )}

            {/* Premium Floating Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200/30 px-4 py-4 input-bar-elevated shadow-2xl shadow-gray-900/10" 
           style={{ 
             paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))'
           }}>
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="w-full rounded-full border-2 border-gray-200/50 focus:border-[#8b0000] focus:ring-2 focus:ring-[#8b0000]/20 h-14 text-base pl-6 pr-6 bg-gradient-to-r from-gray-50 to-white hover:from-white hover:to-gray-50 transition-all duration-300 ease-out shadow-lg shadow-gray-900/5 placeholder:text-gray-400"
                disabled={sending}
                autoComplete="off"
                autoCorrect="on"
                autoCapitalize="sentences"
                spellCheck="true"
                enterKeyHint="send"
                onFocus={() => {
                  // Smooth scroll to bottom when focusing input
                  setTimeout(() => scrollToBottom(false), 100)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
            </div>
            <Button
              type="submit"
              disabled={!messageText.trim() || sending}
              className="bg-gradient-to-br from-[#8b0000] via-red-600 to-red-700 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white rounded-full w-14 h-14 p-0 flex items-center justify-center flex-shrink-0 button-press transition-all duration-300 shadow-xl shadow-red-900/30 hover:shadow-2xl hover:shadow-red-900/40 disabled:opacity-50 disabled:cursor-not-allowed send-button-active hover:scale-105 active:scale-95"
            >
              {sending ? (
                <div className="relative w-5 h-5">
                  {/* Elegant sending animation */}
                  <div className="absolute inset-0 animate-spin">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-white rounded-full"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `rotate(${i * 120}deg) translateX(8px) translateY(-50%)`
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Report Dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to report {match?.other_user.first_name}? This will notify our moderation team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReport} 
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Reporting..." : "Report User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block {match?.other_user.first_name}? They won't be able to message you or see your profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBlock} 
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Blocking..." : "Block User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unmatch Dialog */}
      <AlertDialog open={showUnmatchDialog} onOpenChange={setShowUnmatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unmatch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unmatch with {match?.other_user.first_name}? This will delete your conversation and you won't be able to message each other anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnmatch} 
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Unmatching..." : "Unmatch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Modal */}
      {match?.other_user && (
        <ProfileModal
          profile={match.other_user}
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
        />
      )}
    </div>
  )
} 
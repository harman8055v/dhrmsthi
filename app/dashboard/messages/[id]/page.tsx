"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import { useMessages } from "@/hooks/use-messages"
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
import { ArrowLeft, Send, MoreVertical, Flag, UserX, X } from "lucide-react"
import { getAvatarInitials } from "@/lib/utils"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import ProfileModal from "@/components/profile-modal"

interface Match {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
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
  
  // Check if user has premium access to messaging
  const hasMessagingAccess = profile?.account_status && ['sparsh', 'sangam', 'samarpan'].includes(profile.account_status)
  
  const { 
    messages, 
    loading: messagesLoading, 
    error: messagesError, 
    sending, 
    sendMessage,
    markMessagesAsRead 
  } = useMessages(matchId)

  // Mark messages as read when chat is viewed/focused
  useEffect(() => {
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
  }, [matchId, markMessagesAsRead])

  // Get match details
  const { data: match } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const res = await fetch(`/api/profiles/matches`, { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch match")
      const data = await res.json()
      return data.matches?.find((m: Match) => m.id === matchId) || null
    },
    enabled: isVerified && !!matchId,
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
    if (!isVerified) {
      router.replace("/dashboard/messages")
      return
    }
  }, [loading, user, profile, isVerified, router])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    const timer = setTimeout(() => {
      scrollToBottom()
    }, 100) // Small delay to ensure DOM has updated
    
    return () => clearTimeout(timer)
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || sending) return

    console.log('[Chat] Sending message:', messageText.trim())
    console.log('[Chat] Match ID:', matchId)
    console.log('[Chat] User:', user?.id)
    
    try {
      const success = await sendMessage(messageText.trim())
      console.log('[Chat] Send result:', success)
      if (success) {
        setMessageText("")
        console.log('[Chat] Message sent successfully')
      } else {
        console.error('[Chat] Send failed - success is false')
        toast.error("Failed to send message. Please try again.")
      }
    } catch (error) {
      console.error('[Chat] Send message error:', error)
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

  if (loading || messagesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b0000]"></div>
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
    <div className="flex flex-col h-screen bg-gray-50 fixed inset-0 z-40"
         style={{ 
           paddingBottom: 'env(safe-area-inset-bottom)',
           height: '100vh',
           maxHeight: '100vh'
         }}>
      
      {/* Mobile Chat Header - Fixed */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Prominent Back Button */}
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
            className="p-3 hover:bg-gray-100 rounded-full -ml-2"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </Button>
          
          {/* User Info */}
          <div 
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setProfileModalOpen(true)}
          >
            <div className="relative flex-shrink-0">
              <Avatar className="h-10 w-10">
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
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 text-base truncate">
                {match.other_user.first_name} {match.other_user.last_name}
              </h2>
              <p className={`text-xs truncate ${getActiveStatus() === 'Active now' ? 'text-green-600' : 'text-gray-500'}`}>
                {getActiveStatus()}
              </p>
            </div>
          </div>


          
                     {/* More Options Menu */}
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-full">
                 <MoreVertical className="w-5 h-5 text-gray-600" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="w-48">
               <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-red-600 focus:text-red-600">
                 <Flag className="w-4 h-4 mr-2" />
                 Report User
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => setShowBlockDialog(true)} className="text-red-600 focus:text-red-600">
                 <UserX className="w-4 h-4 mr-2" />
                 Block User
               </DropdownMenuItem>
               <DropdownMenuSeparator />
               <DropdownMenuItem onClick={() => setShowUnmatchDialog(true)} className="text-red-600 focus:text-red-600">
                 <X className="w-4 h-4 mr-2" />
                 Unmatch
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </div>

      {/* Messages Container - Scrollable with bottom padding for floating input */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {messages.length === 0 ? (
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
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender_id === user?.id
                    ? 'bg-[#8b0000] text-white rounded-br-md'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <div className={`flex items-center gap-1 mt-1 ${
                  message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                }`}>
                  <span className={`text-xs ${
                    message.sender_id === user?.id ? 'text-red-100' : 'text-gray-500'
                  }`}>
                    {formatMessageTime(message.created_at)}
                  </span>
                  {message.sender_id === user?.id && message.read_at && (
                    <span className="text-xs text-red-100">✓✓</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="h-8" />
        {/* Spacer for floating input */}
        <div className="h-20" />
      </div>

      {/* Error Display */}
      {messagesError && (
        <div className="flex-shrink-0 px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{messagesError}</p>
        </div>
      )}

            {/* Floating Message Input - Fixed at bottom like nav bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/50 px-4 py-3" 
           style={{ 
             paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
           }}>
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="w-full rounded-full border-gray-300 focus:border-[#8b0000] focus:ring-[#8b0000] h-12 text-base pl-4 pr-4 bg-gray-50 hover:bg-white transition-colors"
                disabled={sending}
                autoComplete="off"
                autoFocus={false}
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
              className="bg-[#8b0000] hover:bg-red-800 text-white rounded-full w-12 h-12 p-0 flex items-center justify-center flex-shrink-0 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="w-5 h-5" />
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
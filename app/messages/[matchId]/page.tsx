'use client'

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { matchService } from "@/lib/data-service"
import { useAuth } from "@/hooks/use-auth"
import { useMessages } from "@/hooks/use-messages"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import PrimaryButton from "@/components/ui/PrimaryButton"
import { Skeleton } from "@/components/ui/skeleton"

interface PageProps {
  params: {
    matchId: string
  }
}

export default function ChatPage({ params }: PageProps) {
  const { matchId } = params
  const { user } = useAuth()
  const {
    messages,
    loading: messagesLoading,
    sendMessage,
    sending,
  } = useMessages(matchId)

  const [otherUserName, setOtherUserName] = useState<string>("")
  const [otherUserPhoto, setOtherUserPhoto] = useState<string | null>(null)
  const [detailsLoading, setDetailsLoading] = useState<boolean>(true)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  const [messageText, setMessageText] = useState<string>("")
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  // Fetch match & other user profile
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setDetailsLoading(true)
        const res = await matchService.getMatchWithProfile(matchId)
        if (!res) {
          setDetailsError("Match not found or access denied")
          return
        }
        setOtherUserName(res.otherUser.full_name || "DharmaSaathi")
        setOtherUserPhoto(res.otherUser.profile_photo_url || null)
      } catch (error: any) {
        console.error("Chat details error", error)
        setDetailsError(error.message || "Failed to load match details")
      } finally {
        setDetailsLoading(false)
      }
    }

    fetchDetails()
  }, [matchId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleSend = async () => {
    if (!messageText.trim()) return
    const success = await sendMessage(messageText.trim())
    if (success) {
      setMessageText("")
    }
  }

  if (detailsError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <p className="mb-4 text-red-600 font-medium">{detailsError}</p>
        <PrimaryButton onClick={() => router.back()}>Go Back</PrimaryButton>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-muted">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white sticky top-0 z-10 shadow-sm">
        <button onClick={() => router.back()} className="text-2xl leading-none">←</button>
        {detailsLoading ? (
          <Skeleton className="w-10 h-10 rounded-full" />
        ) : (
          <Image
            src={otherUserPhoto || "/placeholder-user.jpg"}
            alt={otherUserName}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        )}
        <div className="flex flex-col">
          {detailsLoading ? (
            <Skeleton className="w-32 h-4 rounded" />
          ) : (
            <span className="font-semibold text-lg">{otherUserName}</span>
          )}
          {/* Future: typing indicator can go here */}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 bg-gradient-to-b from-white to-orange-50">
        {messagesLoading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="w-3/4 h-6" />
            ))}
          </div>
        )}

        {!messagesLoading && messages.length === 0 && (
          <p className="text-center text-gray-500 mt-4">No messages yet. Say hi! 👋</p>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id
          return (
            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-xs md:max-w-sm lg:max-w-md rounded-2xl px-4 py-2 text-sm break-words",
                  isMe
                    ? "bg-orange-500 text-white rounded-br-none"
                    : "bg-white border border-gray-200 text-gray-900 rounded-bl-none"
                )}
              >
                {msg.content}
                <span className="block text-[10px] opacity-70 mt-1 text-right">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t bg-white p-3 flex items-end gap-2 sticky bottom-0">
        {/* Emoji button placeholder*/}
        <button
          type="button"
          className="text-2xl px-2 pb-1 hover:opacity-80"
          onClick={() => {
            // On mobile devices, this will open the emoji keyboard if supported
            // For now, no separate picker implementation
          }}
        >
          😊
        </button>

        <Input
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message"
          className="flex-1 text-base"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <PrimaryButton
          onClick={handleSend}
          disabled={sending || !messageText.trim()}
          className="!rounded-full px-4 py-2 text-sm"
        >
          Send
        </PrimaryButton>
      </div>
    </div>
  )
} 
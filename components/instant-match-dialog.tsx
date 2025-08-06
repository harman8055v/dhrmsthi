"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Heart, MessageCircle, X } from "lucide-react"
import { getAvatarInitials } from "@/lib/utils"

interface InstantMatchDialogProps {
  isOpen: boolean
  onClose: () => void
  onStartConversation: () => void
  matchedUser: {
    id: string
    first_name?: string
    last_name?: string
    profile_photo_url?: string
    user_photos?: string[]
  }
}

export default function InstantMatchDialog({
  isOpen,
  onClose,
  onStartConversation,
  matchedUser
}: InstantMatchDialogProps) {
  
  const getPhotoUrl = (user: typeof matchedUser) => {
    const photoUrl = user.profile_photo_url || user.user_photos?.[0]
    if (!photoUrl) return "/placeholder-user.jpg"
    
    return photoUrl.startsWith('http') 
      ? photoUrl 
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${photoUrl}`
  }

  const userName = matchedUser.first_name || "Someone"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Heart Icon */}
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-[#8b0000] to-red-600 rounded-full p-4">
              <Heart className="w-8 h-8 text-white" fill="currentColor" />
            </div>
          </div>

          {/* Title */}
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Congratulations! 🎉
          </DialogTitle>
          
          {/* Description */}
          <DialogDescription className="text-gray-600 text-base">
            You and {userName} have matched! You can now start a conversation.
          </DialogDescription>
        </DialogHeader>

        {/* User Avatar */}
        <div className="flex justify-center py-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={getPhotoUrl(matchedUser)} alt={userName} />
            <AvatarFallback className="bg-gray-200 text-gray-600 text-lg font-semibold">
              {getAvatarInitials(matchedUser.first_name, matchedUser.last_name)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* User Name */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {userName} {matchedUser.last_name || ""}
          </h3>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={onStartConversation}
            className="w-full bg-[#8b0000] hover:bg-[#6b0000] text-white"
            size="lg"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Start Conversation
          </Button>
          
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            size="lg"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
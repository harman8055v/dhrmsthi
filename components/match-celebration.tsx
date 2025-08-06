"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, X, Sparkles } from "lucide-react"
import { getAvatarInitials } from "@/lib/utils"

interface MatchCelebrationProps {
  isOpen: boolean
  onClose: () => void
  onSendMessage?: () => void
  onKeepSwiping?: () => void
  matchedUser: {
    id: string
    first_name?: string
    last_name?: string
    profile_photo_url?: string
    user_photos?: string[]
  }
  currentUser?: {
    first_name?: string
    last_name?: string
    profile_photo_url?: string
    user_photos?: string[]
  }
}

export default function MatchCelebration({
  isOpen,
  onClose,
  onSendMessage,
  onKeepSwiping,
  matchedUser,
  currentUser
}: MatchCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true)
      // Auto close after 8 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  const getPhotoUrl = (user: typeof matchedUser) => {
    const photoUrl = user.profile_photo_url || user.user_photos?.[0]
    if (!photoUrl) return "/placeholder-user.jpg"
    
    return photoUrl.startsWith('http') 
      ? photoUrl 
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${photoUrl}`
  }

  const confettiItems = Array.from({ length: 50 }, (_, i) => i)
  const heartItems = Array.from({ length: 20 }, (_, i) => i)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Confetti Animation */}
          {showConfetti && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {confettiItems.map((item) => (
                <motion.div
                  key={item}
                  initial={{ 
                    y: -100, 
                    x: Math.random() * window.innerWidth,
                    rotate: 0,
                    opacity: 1
                  }}
                  animate={{ 
                    y: window.innerHeight + 100,
                    rotate: 360,
                    opacity: 0
                  }}
                  transition={{
                    duration: 3,
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: ['#8b0000', '#ff69b4', '#ffd700', '#ff4500', '#9370db'][Math.floor(Math.random() * 5)]
                  }}
                />
              ))}
            </div>
          )}

          {/* Floating Hearts */}
          {showConfetti && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {heartItems.map((item) => (
                <motion.div
                  key={item}
                  initial={{ 
                    y: window.innerHeight + 50,
                    x: Math.random() * window.innerWidth,
                    scale: 0,
                    opacity: 0
                  }}
                  animate={{ 
                    y: -100,
                    scale: [0, 1, 0.8, 1],
                    opacity: [0, 1, 1, 0]
                  }}
                  transition={{
                    duration: 4,
                    delay: Math.random() * 3,
                    ease: "easeOut"
                  }}
                  className="absolute"
                >
                  <Heart 
                    className="w-6 h-6 text-red-500" 
                    fill="currentColor"
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* Main Content */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="bg-white rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="flex justify-center mb-3"
              >
                <div className="bg-gradient-to-r from-[#8b0000] to-red-600 rounded-full p-3">
                  <Heart className="w-8 h-8 text-white" fill="currentColor" />
                </div>
              </motion.div>
              
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-gray-900 mb-2"
              >
                It's a Match! 🎉
              </motion.h2>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-gray-600 text-sm"
              >
                You and {matchedUser.first_name} liked each other
              </motion.p>
            </div>

            {/* User Photos */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-4 mb-6"
            >
              {/* Current User Photo */}
              {currentUser && (
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="relative"
                >
                  <Avatar className="w-20 h-20 ring-4 ring-[#8b0000]/20">
                    <AvatarImage
                      src={getPhotoUrl(currentUser)}
                      className="object-cover"
                      style={{ objectPosition: '50% 20%' }}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-[#8b0000] to-red-700 text-white font-semibold text-lg">
                      {getAvatarInitials(currentUser.first_name, currentUser.last_name)}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              )}

              {/* Heart in the middle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="z-10"
              >
                <div className="bg-gradient-to-r from-[#8b0000] to-red-600 rounded-full p-2">
                  <Heart className="w-6 h-6 text-white" fill="currentColor" />
                </div>
              </motion.div>

              {/* Matched User Photo */}
              <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="relative"
              >
                <Avatar className="w-20 h-20 ring-4 ring-[#8b0000]/20">
                  <AvatarImage
                    src={getPhotoUrl(matchedUser)}
                    className="object-cover"
                    style={{ objectPosition: '50% 20%' }}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[#8b0000] to-red-700 text-white font-semibold text-lg">
                    {getAvatarInitials(matchedUser.first_name, matchedUser.last_name)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="space-y-3"
            >
              <Button
                onClick={onSendMessage}
                className="w-full bg-gradient-to-r from-[#8b0000] to-red-600 hover:from-[#a00000] hover:to-red-700 text-white font-semibold py-3 rounded-xl shadow-lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Send Message
              </Button>
              
              <Button
                onClick={onKeepSwiping || onClose}
                variant="outline"
                className="w-full py-3 rounded-xl border-gray-300 hover:bg-gray-50"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Keep Swiping
              </Button>
            </motion.div>

            {/* Auto-close indicator */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 8, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#8b0000] to-red-600 rounded-b-3xl origin-left"
              style={{ width: '100%' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
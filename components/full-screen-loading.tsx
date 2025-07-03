"use client"

import { useState, useEffect } from "react"
import { Loader2, Shield, CheckCircle } from "lucide-react"

interface FullScreenLoadingProps {
  title: string
  subtitle: string
  messages: string[]
  duration?: number
}

export default function FullScreenLoading({ title, subtitle, messages, duration = 4000 }: FullScreenLoadingProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const messageInterval = duration / messages.length
    const progressInterval = 50 // Update progress every 50ms for smooth animation

    // Progress animation
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer)
          return 100
        }
        return prev + 100 / (duration / progressInterval)
      })
    }, progressInterval)

    // Message rotation
    const messageTimer = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev >= messages.length - 1) {
          clearInterval(messageTimer)
          return prev
        }
        return prev + 1
      })
    }, messageInterval)

    return () => {
      clearInterval(progressTimer)
      clearInterval(messageTimer)
    }
  }, [messages.length, duration])

  const currentMessage = messages[currentMessageIndex]
  const isEncrypting = currentMessage?.toLowerCase().includes("encrypt")
  const isComplete = progress >= 100

  return (
    <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
      {/* Backdrop overlay to prevent any background interactions */}
      <div className="absolute inset-0 z-[99998] bg-black/10 backdrop-blur-sm" />

      {/* Main content */}
      <div className="relative z-[99999] text-center p-8 max-w-md mx-auto">
        {/* Main icon/animation */}
        <div className="mb-8">
          {isComplete ? (
            <div className="w-20 h-20 mx-auto mb-4 text-green-500 animate-bounce">
              <CheckCircle className="w-full h-full" />
            </div>
          ) : (
            <div className="relative w-20 h-20 mx-auto mb-4">
              <Loader2 className="w-full h-full text-orange-500 animate-spin" />
              {isEncrypting && <Shield className="absolute inset-2 w-12 h-12 text-green-600 animate-pulse" />}
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>

        {/* Subtitle */}
        <p className="text-lg text-gray-600 mb-8">{subtitle}</p>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress percentage */}
        <div className="text-sm text-gray-500 mb-4">{Math.round(progress)}% Complete</div>

        {/* Current message */}
        <div className="min-h-[60px] flex items-center justify-center">
          <p
            className={`text-base transition-all duration-500 ${
              isEncrypting
                ? "text-green-700 font-semibold bg-green-50 px-4 py-2 rounded-lg border border-green-200"
                : "text-gray-700"
            }`}
          >
            {isEncrypting && <Shield className="inline w-4 h-4 mr-2 text-green-600" />}
            {currentMessage}
          </p>
        </div>

        {/* Additional loading indicators */}
        <div className="flex justify-center space-x-2 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i <= currentMessageIndex ? "bg-orange-500" : "bg-gray-300"
              }`}
              style={{
                animationDelay: `${i * 0.2}s`,
                animation: i <= currentMessageIndex ? "pulse 1.5s infinite" : "none",
              }}
            />
          ))}
        </div>

        {/* Security notice for encryption */}
        {isEncrypting && (
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-700 flex items-center justify-center">
              <Shield className="w-3 h-3 mr-1" />
              Your data is being securely encrypted
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

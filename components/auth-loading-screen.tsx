"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { Shield, Users, CheckCircle, Lock } from "lucide-react"

interface AuthLoadingScreenProps {
  userId?: string
  isNewUser?: boolean
}

const inspirationalMessages = [
  "It's time to move from Drama to Dharma ✨",
  "Your spiritual journey begins now 🌸",
  "Connecting hearts through sacred bonds 💫",
  "Where souls meet and destinies align 🕉️",
  "Building meaningful relationships with purpose 🙏",
  "Your path to spiritual companionship awaits ✨",
]

const trustElements = [
  { icon: Shield, text: "SSL Encrypted", subtext: "Your data is secure" },
  { icon: Users, text: "50,000+ Members", subtext: "Growing community" },
  { icon: CheckCircle, text: "Verified Profiles", subtext: "Authentic connections" },
  { icon: Lock, text: "Private & Secure", subtext: "Protected messaging" },
]

export default function AuthLoadingScreen({ userId, isNewUser }: AuthLoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 5
      })
    }, 50)

    // Message rotation
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % inspirationalMessages.length)
    }, 2000)

    // Complete loading and redirect
    const completeTimer = setTimeout(() => {
      setIsComplete(true)
      
      // Simple redirect after a short delay
      setTimeout(() => {
        if (isNewUser) {
          router.push("/onboarding")
        } else {
          router.push("/dashboard")
        }
      }, 500)
    }, 2000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(messageInterval)
      clearTimeout(completeTimer)
    }
  }, [isNewUser, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-pink-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-orange-300 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-pink-300 rounded-full blur-3xl animate-pulse-slow animation-delay-300"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-amber-300 rounded-full blur-2xl animate-float"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-md mx-auto">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full blur-lg opacity-30 animate-pulse-glow"></div>
            <div className="relative w-full h-full bg-white rounded-full shadow-lg flex items-center justify-center">
              <Image src="/logo.png" alt="DharmaSaathi" width={60} height={60} className="object-contain" priority />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">DharmaSaathi</h1>
          <p className="text-sm text-gray-600">Where Hearts Meet Dharma</p>
        </div>

        {/* Loading Animation */}
        <div className="mb-8">
          <div className="relative w-20 h-20 mx-auto mb-6">
            {/* Outer ring */}
            <div className="absolute inset-0 border-4 border-orange-200 rounded-full"></div>
            {/* Middle ring */}
            <div className="absolute inset-2 border-4 border-pink-300 rounded-full animate-spin"></div>
            {/* Inner ring */}
            <div
              className="absolute inset-4 border-4 border-amber-400 rounded-full animate-spin animation-delay-150"
              style={{ animationDirection: "reverse" }}
            ></div>
            {/* Center dot */}
            <div className="absolute inset-6 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full animate-pulse"></div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-pink-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mb-2">{progress}% Complete</p>
        </div>

        {/* Inspirational Message */}
        <div className="mb-8 h-16 flex items-center justify-center">
          <p className="text-lg font-medium text-gray-700 loading-fade-in px-4">
            {inspirationalMessages[currentMessage]}
          </p>
        </div>

        {/* Trust Elements */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {trustElements.map((element, index) => (
            <div key={index} className="flex items-center space-x-2 text-left">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <element.icon className="w-4 h-4 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{element.text}</p>
                <p className="text-xs text-gray-500 truncate">{element.subtext}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Success State */}
        {isComplete && (
          <div className="loading-fade-in">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-green-600 font-medium">Ready!</p>
            <p className="text-sm text-gray-600 mt-1">Redirecting you now...</p>
          </div>
        )}
      </div>

      {/* Bottom Trust Badge */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Shield className="w-3 h-3" />
          <span>Secured by 256-bit SSL encryption</span>
        </div>
      </div>
    </div>
  )
}

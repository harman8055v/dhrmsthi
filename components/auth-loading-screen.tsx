"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { Shield, Users, CheckCircle, Lock } from "lucide-react"

interface AuthLoadingScreenProps {
  userId?: string
  isNewUser?: boolean
  isMobileLogin?: boolean
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

export default function AuthLoadingScreen({ userId, isNewUser, isMobileLogin }: AuthLoadingScreenProps) {
  const [progress, setProgress] = useState(0)
  const [currentMessage, setCurrentMessage] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // 1) Try to establish session from magic link code in URL (email sign-in)
    const tryExchangeEmailLink = async () => {
      try {
        const url = new URL(window.location.href)
        const hasCode = url.searchParams.has('code') || url.searchParams.has('token_hash')
        const errorDesc = url.searchParams.get('error_description')

        if (errorDesc) {
          console.error('[AuthLoading] Magic link error:', errorDesc)
          return
        }

        if (!hasCode) return

        // First attempt: let Supabase handle it automatically via exchangeCodeForSession
        const code = url.searchParams.get('code') || url.searchParams.get('token_hash') || ''
        if (!code) return

        const { data: exData, error: exErr } = await supabase.auth.exchangeCodeForSession(code)
        if (exErr) {
          console.error('[AuthLoading] exchangeCodeForSession error:', exErr)
          // Fallback: verifyOtp for email link flows
          const { error: verifyErr } = await supabase.auth.verifyOtp({
            token_hash: code,
            type: 'email'
          })
          if (verifyErr) {
            console.error('[AuthLoading] verifyOtp fallback error:', verifyErr)
            return
          }
        }

        // Clean URL after processing
        window.history.replaceState({}, document.title, '/auth-loading')

        // Ensure session exists and derive userId
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user?.id) {
          // Route with userId so downstream logic can fetch profile and route appropriately
          router.replace(`/auth-loading?userId=${session.user.id}&isNew=false`)
        }
      } catch (err) {
        console.error('[AuthLoading] Error processing magic link:', err)
      }
    }

    // Kick off code exchange immediately on mount
    tryExchangeEmailLink()

    // Handle mobile login
    if (isMobileLogin && userId) {
      // For mobile login, we need to verify the user and redirect appropriately
      const handleMobileLogin = async () => {
        try {
          // Call the mobile login API to verify the session
          const response = await fetch('/api/auth/mobile-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });

          if (response.ok) {
            const data = await response.json();
            
            // Use the magic link token to establish a session
            if (data.token && data.type) {
              const { error: sessionError } = await supabase.auth.verifyOtp({
                token_hash: data.token,
                type: data.type
              });

              if (sessionError) {
                console.error('Session creation error:', sessionError);
                // Try alternative approach - exchange session
                const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(data.token);
                
                if (exchangeError) {
                  console.error('Session exchange error:', exchangeError);
                  router.push("/");
                  return;
                }
              }

              // Session established, clear localStorage
              if (typeof window !== 'undefined') {
                localStorage.removeItem('mobileLoginUserId');
              }

              // Redirect based on onboarding status
              setTimeout(() => {
                if (data.isOnboarded) {
                  router.push("/dashboard")
                } else {
                  router.push("/onboarding")
                }
              }, 1000)
            } else {
              // Fallback - no token received
              console.error('No auth token received');
              router.push("/");
            }
          } else {
            // Mobile login failed, redirect to home
            router.push("/")
          }
        } catch (error) {
          console.error("Mobile login error:", error)
          router.push("/")
        }
      };

      handleMobileLogin();
      return;
    }

    // 2) Regular auth flow (non-mobile login)
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 2
      })
    }, 100)

    // Message rotation
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % inspirationalMessages.length)
    }, 2000)

    // Complete loading after 5 seconds
    const completeTimer = setTimeout(async () => {
      setIsComplete(true)

      if (userId) {
        try {
          // Check onboarding status
          const { data: profile } = await supabase
            .from("users")
            .select("is_onboarded")
            .eq("id", userId)
            .single()

          // Redirect based on onboarding status
          setTimeout(() => {
            if ((profile as any)?.is_onboarded) {
              router.push("/dashboard")
            } else {
              router.push("/onboarding")
            }
          }, 1000)
        } catch (error) {
          console.error("Error checking profile:", error)
          // Fallback redirect
          setTimeout(() => {
            router.push(isNewUser ? "/onboarding" : "/dashboard")
          }, 1000)
        }
      } else {
        // Fallback if no userId
        setTimeout(() => {
          router.push(isNewUser ? "/onboarding" : "/dashboard")
        }, 1000)
      }
    }, 5000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(messageInterval)
      clearTimeout(completeTimer)
    }
  }, [userId, isNewUser, router, isMobileLogin])

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

        {/* Processing Message */}
        <div className="mb-8">
          <p className="text-gray-600 mb-2">Please wait while we process your account</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce-dot"></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce-dot animation-delay-150"></div>
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce-dot animation-delay-300"></div>
          </div>
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
            <p className="text-green-600 font-medium">Account processed successfully!</p>
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

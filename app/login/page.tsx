'use client'
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import AuthDialog from "@/components/auth-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, CheckCircle } from "lucide-react"

function LoginContent() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showResetSuccess, setShowResetSuccess] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Trigger animations after mount
    setIsLoaded(true)
    
    // Check for password reset success
    if (searchParams.get('reset') === 'success') {
      setShowResetSuccess(true)
      // Auto dismiss success message after 5 seconds
      setTimeout(() => setShowResetSuccess(false), 5000)
    }
  }, [searchParams])

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-brand-50/80 via-orange-50 to-amber-50">
      {/* Header */}
      <Header />

      {/* Hero / Login Section */}
      <section className="flex-1 flex items-center justify-center relative overflow-hidden py-20 px-4">
        {/* Success Message for Password Reset */}
        {showResetSuccess && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
            <Card className="bg-green-50 border-green-200 shadow-lg">
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">Password Reset Successful!</p>
                  <p className="text-green-600 text-sm">You can now log in with your new password.</p>
                </div>
                <button 
                  onClick={() => setShowResetSuccess(false)}
                  className="text-green-600 hover:text-green-800 ml-2"
                >
                  ✕
                </button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={`absolute top-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-brand-200/30 to-orange-200/30 rounded-full blur-3xl opacity-50 transition-opacity duration-1000 ${isLoaded ? "animate-pulse-slow" : ""}`}
          ></div>
          <div
            className={`absolute bottom-1/4 right-1/3 w-60 h-60 bg-gradient-to-r from-pink-200/30 to-rose-300/30 rounded-full blur-3xl opacity-40 transition-opacity duration-1000 delay-300 ${isLoaded ? "animate-pulse-slow" : ""}`}
          ></div>
        </div>

        {/* Content */}
        <div
          className={`relative z-10 max-w-2xl text-center space-y-6 transition-all duration-700 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
        >
          {/* Badge */}
          <div className="inline-flex items-center px-3 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-brand-100/50">
            <Lock className="w-4 h-4 text-brand-500 mr-2" />
            <span className="text-sm font-medium text-brand-700">Secure Access</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Login to
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 mt-1">
              Continue
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-xl mx-auto">
            Please sign in to access your dashboard and connect with like-minded spiritual seekers.
          </p>

          {/* CTA */}
          <Button
            size="lg"
            onClick={() => setDialogOpen(true)}
            className="bg-gradient-to-r from-brand-700 to-primary hover:from-brand-800 hover:to-primary/90 text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Login Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        defaultMode="login"
      />
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
} 
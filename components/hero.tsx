"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Sparkles, Shield, ArrowRight, Compass } from "lucide-react"
import Image from "next/image"
import AuthDialog from "./auth-dialog"

export default function Hero() {
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Trigger animations after component mounts
    setIsLoaded(true)
  }, [])

  const openAuth = (mode: "signup" | "login") => {
    setAuthMode(mode)
    setIsAuthOpen(true)
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50/80 via-brand-100/60 to-brand-200/40 overflow-hidden pt-20 pb-8"
      >
        {/* Simplified Background Elements for Mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={`absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-brand-200/20 to-orange-200/20 rounded-full blur-3xl opacity-40 transition-opacity duration-1000 ${isLoaded ? "animate-pulse-slow" : ""}`}
          ></div>
          <div
            className={`absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-rose-200/20 to-pink-200/20 rounded-full blur-3xl opacity-30 transition-opacity duration-1000 delay-500 ${isLoaded ? "animate-pulse-slow" : ""}`}
          ></div>
        </div>

        {/* Simplified Floating Icons */}
        {isLoaded && (
          <>
            <div className="absolute top-32 left-8 md:left-16 animate-float opacity-30">
              <Heart className="w-4 h-4 md:w-5 md:h-5 text-brand-400" />
            </div>
            <div className="absolute top-48 right-8 md:right-24 animate-float-delayed opacity-30">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-brand-300" />
            </div>
          </>
        )}

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Content */}
            <div className="text-center lg:text-left space-y-6 lg:space-y-8 order-1 lg:order-1">
              {/* Badge */}
              <div
                className={`inline-flex items-center px-3 py-2 md:px-4 md:py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-brand-100/50 transition-all duration-700 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
              >
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-brand-500 mr-2 flex-shrink-0" />
                <span className="text-xs md:text-sm font-medium text-brand-700 leading-tight">
                  India's First Spiritual Matchmaking Platform
                </span>
              </div>

              {/* Main Heading */}
              <div
                className={`space-y-3 md:space-y-4 transition-all duration-700 delay-200 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Find Your
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800 mt-1">
                    Spiritual Soulmate
                  </span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Connect with like-minded souls on a journey of dharma, devotion, and divine love. Your spiritual
                  companion awaits on this sacred path.
                </p>
              </div>

              {/* Features */}
              <div
                className={`flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start transition-all duration-700 delay-400 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
              >
                <div className="flex items-center gap-3 text-gray-700 justify-center lg:justify-start">
                  <div className="p-2 bg-gradient-to-r from-brand-100 to-brand-200 rounded-full flex-shrink-0">
                    <Heart className="w-4 h-4 md:w-5 md:h-5 text-brand-600" />
                  </div>
                  <span className="font-medium text-sm md:text-base">From Drama to Dharma</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700 justify-center lg:justify-start">
                  <div className="p-2 bg-gradient-to-r from-brand-200 to-brand-300 rounded-full flex-shrink-0">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-brand-600" />
                  </div>
                  <span className="font-medium text-sm md:text-base">Spiritual Compatibility</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div
                className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start transition-all duration-700 delay-600 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
              >
                <Button
                  onClick={() => scrollToSection("signup")}
                  size="lg"
                  className="bg-gradient-to-r from-brand-700 to-primary hover:from-brand-800 hover:to-primary/90 text-white font-semibold px-6 md:px-8 py-3 md:py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group w-full sm:w-auto"
                >
                  Start Your Journey
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
                <Button
                  onClick={() => scrollToSection("how-it-works")}
                  variant="outline"
                  size="lg"
                  className="border-2 border-brand-200 text-brand-700 hover:bg-brand-50 px-6 md:px-8 py-3 md:py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 group w-full sm:w-auto"
                >
                  <Compass className="w-4 h-4 md:w-5 md:h-5 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                  How It Works
                </Button>
              </div>

              {/* Stats */}
              <div
                className={`grid grid-cols-3 gap-4 md:gap-6 pt-6 md:pt-8 transition-all duration-700 delay-800 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
              >
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
                    50K+
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 leading-tight">Spiritual Seekers</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-brand-700 to-brand-800 bg-clip-text text-transparent">
                    500+
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 leading-tight">Success Stories</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-brand-800 to-brand-900 bg-clip-text text-transparent">
                    150+
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 leading-tight">Cities</div>
                </div>
              </div>
            </div>

            {/* Right Column - Hero Image */}
            <div
              className={`relative transition-all duration-700 delay-300 order-2 lg:order-2 ${isLoaded ? "animate-fade-in-up" : "opacity-0"}`}
            >
              {/* Main Image Container */}
              <div className="relative mx-auto max-w-sm md:max-w-md lg:max-w-lg">
                {/* Simplified Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-200/30 via-brand-300/20 to-brand-400/30 rounded-3xl blur-2xl opacity-60"></div>

                {/* Image Card */}
                <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl border border-white/60 transform hover:scale-105 transition-transform duration-500 group">
                  <Image
                    src="/images/spiritual-couple.jpg"
                    alt="Spiritual couple finding meaningful connection through DharmaSaathi"
                    width={320}
                    height={400}
                    className="w-full h-auto rounded-xl md:rounded-2xl"
                    priority
                    sizes="(max-width: 768px) 320px, (max-width: 1024px) 400px, 500px"
                  />

                  {/* Floating Elements on Image */}
                  <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white p-2 md:p-3 rounded-full shadow-lg opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                    <Heart className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="absolute -bottom-2 -left-2 md:-bottom-3 md:-left-3 bg-gradient-to-r from-brand-700 to-brand-800 text-white p-2 md:p-3 rounded-full shadow-lg opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                </div>

                {/* Trust Indicators - Overlapping the image */}
                <div className="absolute -bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl p-2 md:p-3 shadow-lg border border-white/60 max-w-[220px]">
                  <div className="flex items-center justify-center gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">Verified Profiles</span>
                    </div>
                    <div className="w-px h-3 md:h-4 bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-3 h-3 text-brand-500 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">Safe & Secure</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Dialog */}
      <AuthDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} defaultMode={authMode} />
    </>
  )
}

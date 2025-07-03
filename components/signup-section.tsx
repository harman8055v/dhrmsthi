"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, Sparkles, ArrowRight, Phone, Mail, User, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"
import AuthDialog from "./auth-dialog"
import FullScreenLoading from "./full-screen-loading"

interface FormData {
  firstName: string
  lastName: string
  email: string
  mobileNumber: string
  password: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  mobileNumber?: string
  password?: string
  general?: string
}

export default function SignupSection() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    password: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [referralCode, setReferralCode] = useState<string>("")
  const router = useRouter()
  const searchParams = useSearchParams()

  // Capture referral code from URL parameters
  useEffect(() => {
    const refParam = searchParams.get('ref')
    if (refParam) {
      setReferralCode(refParam)
      console.log("Referral code captured:", refParam)
    }
  }, [searchParams])

  const validateMobileNumber = (mobile: string): boolean => {
    const cleanMobile = mobile.replace(/[^\d+]/g, "")
    if (!cleanMobile) return false
    const mobileRegex = /^[+]?[1-9]\d{9,14}$/
    return mobileRegex.test(cleanMobile)
  }

  const formatMobileNumber = (mobile: string): string => {
    let cleaned = mobile.replace(/[^\d+]/g, "")
    if (!cleaned.startsWith("+") && cleaned.length === 10 && cleaned.match(/^[6-9]/)) {
      cleaned = "+91" + cleaned
    }
    return cleaned
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters"
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters"
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required"
    } else if (!validateMobileNumber(formData.mobileNumber)) {
      newErrors.mobileNumber = "Please enter a valid mobile number"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof FormData, value: string) => {
    let processedValue = value

    if (field === "mobileNumber") {
      processedValue = formatMobileNumber(value)
    }

    setFormData((prev) => ({ ...prev, [field]: processedValue }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.mobileNumber,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        try {
          const profileData = {
            id: authData.user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: `${formData.firstName} ${formData.lastName}`,
            phone: formData.mobileNumber,
            email_verified: !!authData.user.email_confirmed_at,
            verification_status: "pending", // Default to unverified
            onboarding_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          const { error: profileError } = await supabase.from("users").insert(profileData).select()

          if (profileError) {
            console.error("Profile creation error:", profileError)
          }

          // Process referral if referral code exists
          if (referralCode) {
            try {
              console.log("Processing referral with code:", referralCode)
              const response = await fetch('/api/referrals/signup', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  newUserId: authData.user.id,
                  referralCode: referralCode
                })
              })
              
              const result = await response.json()
              
              if (response.ok && result.success) {
                console.log("Referral processed successfully:", result.message)
              } else {
                console.warn("Referral processing issue:", result.message || result.error)
              }
            } catch (referralError) {
              console.error("Referral processing failed:", referralError)
            }
          }
        } catch (profileError) {
          console.error("Profile creation failed:", profileError)
        }

        setIsSuccess(true)
        setTimeout(() => {
          router.push("/onboarding")
        }, 4000) // Increased duration for better UX
      }
    } catch (error: any) {
      console.error("Sign up error:", error)
      setIsLoading(false) // Reset loading state on error
      if (error.message?.includes("already registered")) {
        setErrors({ email: "This email is already registered. Please try signing in instead." })
      } else if (error.message?.includes("phone")) {
        setErrors({ mobileNumber: "This mobile number is already registered." })
      } else {
        setErrors({ general: error.message || "An error occurred during sign up. Please try again." })
      }
    }
  }

  const openLoginDialog = () => {
    setIsAuthOpen(true)
  }

  // Show full-screen loading when successful
  if (isSuccess) {
    return (
      <FullScreenLoading
        title="Welcome to DharmaSaathi! 🌸"
        subtitle="Your spiritual journey begins now"
        messages={[
          "Creating your sacred profile...",
          "Connecting you with divine souls...",
          "Preparing your spiritual dashboard...",
          "Ready to find your dharma partner!",
        ]}
        duration={4000}
      />
    )
  }

  return (
    <>
      <section id="signup" className="py-16 md:py-24 bg-gradient-to-b from-background to-brand-50/30">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-block rounded-full glass-effect px-6 py-3 text-sm shadow-lg mb-6">
                <Sparkles className="inline-block w-5 h-5 mr-2 text-primary" />
                <span className="font-semibold text-primary">Begin Your Sacred Journey</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Join DharmaSaathi Today
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Create your account and start connecting with like-minded spiritual souls who share your values and
                journey.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Benefits */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-primary/10 to-rose-100 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Spiritual Compatibility</h3>
                    <p className="text-muted-foreground">
                      Our unique matching algorithm connects you with souls who share your spiritual practices and
                      beliefs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-primary/10 to-purple-100 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Verified Community</h3>
                    <p className="text-muted-foreground">
                      Join a safe, verified community of genuine spiritual seekers looking for meaningful connections.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-100 to-primary/10 rounded-xl flex items-center justify-center">
                    <ArrowRight className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">From Drama to Dharma</h3>
                    <p className="text-muted-foreground">
                      Move beyond superficial connections to find a partner who supports your spiritual growth and
                      evolution.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Signup Form */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/50">
                {errors.general && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{errors.general}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-gray-700 font-medium">
                        First Name *
                      </Label>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="firstName"
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleChange("firstName", e.target.value)}
                          className={`pl-10 ${errors.firstName ? "border-red-500" : ""}`}
                          placeholder="First name"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="lastName" className="text-gray-700 font-medium">
                        Last Name *
                      </Label>
                      <div className="relative mt-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="lastName"
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleChange("lastName", e.target.value)}
                          className={`pl-10 ${errors.lastName ? "border-red-500" : ""}`}
                          placeholder="Last name"
                          disabled={isLoading}
                        />
                      </div>
                      {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-gray-700 font-medium">
                      Email Address *
                    </Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                        placeholder="your@email.com"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="mobileNumber" className="text-gray-700 font-medium">
                      Mobile Number *
                    </Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="mobileNumber"
                        type="tel"
                        value={formData.mobileNumber}
                        onChange={(e) => handleChange("mobileNumber", e.target.value)}
                        className={`pl-10 ${errors.mobileNumber ? "border-red-500" : ""}`}
                        placeholder="+91 98765 43210"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.mobileNumber && <p className="mt-1 text-xs text-red-600">{errors.mobileNumber}</p>}
                    <p className="mt-1 text-xs text-gray-500">Include country code (e.g., +91 for India)</p>
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-gray-700 font-medium">
                      Password *
                    </Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        className={`pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                        placeholder="Create password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                    <p className="mt-1 text-xs text-gray-500">8+ characters with uppercase, lowercase, and number</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-brand-700 to-primary hover:from-brand-800 hover:to-primary/90 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-center mt-6">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <button
                      onClick={openLoginDialog}
                      className="text-brand-600 hover:text-brand-700 font-medium transition-colors hover:underline"
                    >
                      Sign in here
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Dialog for Login */}
      <AuthDialog isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} defaultMode="login" />
    </>
  )
}

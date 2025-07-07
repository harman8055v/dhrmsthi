"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, Sparkles, ArrowRight, Phone, Mail, User, Loader2, Lock, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  password?: string
  general?: string
}

export default function SignupSection() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const router = useRouter()


  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/[^\d+]/g, "")
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

    const cleanPhone = formData.phone.replace(/[^\d+]/g, "")
    if (cleanPhone && (cleanPhone.length < 10 || cleanPhone.length > 15)) {
      newErrors.phone = "Please enter a valid phone number"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof FormData, value: string) => {
    let processedValue = value

    if (field === "phone") {
      processedValue = formatPhoneNumber(value)
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
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone || null,
          },
        },
      })

      if (error) throw error

      router.push('/dashboard')

    } catch (error: any) {
      console.error("Signup error:", error)
      if (error.message?.includes("already registered")) {
        setErrors({ general: "This email is already registered. Please sign in instead." })
      } else {
        setErrors({ general: error.message || "Failed to create account. Please try again." })
      }
    } finally {
      setIsLoading(false)
    }
  }


  // Don't show any loading screen - we redirect immediately

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
                    <Label htmlFor="phone" className="text-gray-700 font-medium">
                      Phone Number (optional)
                    </Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                        placeholder="+91 98765 43210"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
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
                        placeholder="Min 6 characters"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                  </div>


                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:to-primary text-white shadow-lg"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 h-4 w-4" />
                        Create My Account
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="font-medium text-primary hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  )
}
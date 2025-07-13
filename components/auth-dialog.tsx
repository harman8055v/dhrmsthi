"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { Loader2, Eye, EyeOff, ArrowLeft, Mail, CheckCircle, Phone } from "lucide-react"
import PhoneInput from "@/components/ui/phone-input"
import { formatPhoneE164, isValidPhoneE164 } from "@/lib/utils"

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  defaultMode: "signup" | "login"
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  mobileNumber: string
  password: string
}

interface LoginData {
  email: string
  password: string
}

interface ResetData {
  email: string
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  mobileNumber?: string
  password?: string
  general?: string
}

type ViewMode = "auth" | "forgot-password" | "reset-sent"

export default function AuthDialog({ isOpen, onClose, defaultMode }: AuthDialogProps) {
  const [signupData, setSignupData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    password: "",
  })
  const [loginData, setLoginData] = useState<LoginData>({
    email: "",
    password: "",
  })
  const [resetData, setResetData] = useState<ResetData>({
    email: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState(defaultMode)
  const [viewMode, setViewMode] = useState<ViewMode>("auth")
  const router = useRouter()

  const validateMobileNumber = (mobile: string): boolean => {
    return isValidPhoneE164(mobile)
  }

  const formatMobileNumber = (mobile: string): string => {
    return formatPhoneE164(mobile)
  }

  const validateSignupForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!signupData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    } else if (signupData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters"
    }

    if (!signupData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    } else if (signupData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters"
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!signupData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!emailRegex.test(signupData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!signupData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required"
    } else if (!validateMobileNumber(signupData.mobileNumber)) {
      newErrors.mobileNumber = "Please enter a valid mobile number"
    }

    if (!signupData.password) {
      newErrors.password = "Password is required"
    } else if (signupData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(signupData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateLoginForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!loginData.email.trim()) {
      newErrors.email = "Email is required"
    }

    if (!loginData.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateResetForm = (): boolean => {
    const newErrors: FormErrors = {}

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!resetData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!emailRegex.test(resetData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignupChange = (field: keyof FormData, value: string) => {
    let processedValue = value

    // Format mobile number as user types
    if (field === "mobileNumber") {
      processedValue = formatMobileNumber(value)
    }

    setSignupData((prev) => ({ ...prev, [field]: processedValue }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleLoginChange = (field: keyof LoginData, value: string) => {
    setLoginData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleResetChange = (field: keyof ResetData, value: string) => {
    setResetData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateSignupForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            first_name: signupData.firstName,
            last_name: signupData.lastName,
            full_name: `${signupData.firstName} ${signupData.lastName}`,
            phone: signupData.mobileNumber,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        try {
          const profileData = {
            id: authData.user.id,
            email: signupData.email,
            first_name: signupData.firstName,
            last_name: signupData.lastName,
            full_name: `${signupData.firstName} ${signupData.lastName}`,
            phone: signupData.mobileNumber,
            email_verified: !!authData.user.email_confirmed_at, // Set based on auth status
            verification_status: "pending",
            is_onboarded: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          const { error: profileError } = await supabase.from("users").insert(profileData).select()

          if (profileError) {
            console.error("Profile creation error:", profileError)
          }
        } catch (profileError) {
          console.error("Profile creation failed:", profileError)
        }

        // Close dialog and redirect to loading screen
        onClose()
        router.push(`/auth-loading?userId=${authData.user.id}&isNew=true`)
      }
    } catch (error: any) {
      console.error("Sign up error:", error)
      if (error.message?.includes("already registered")) {
        setErrors({ email: "This email is already registered. Please try signing in instead." })
      } else if (error.message?.includes("phone")) {
        setErrors({ mobileNumber: "This mobile number is already registered." })
      } else {
        setErrors({ general: error.message || "An error occurred during sign up. Please try again." })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateLoginForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (error) throw error

      if (data.user) {
        // Get user profile
        const { data: profile } = await supabase
          .from("users")
          .select("is_onboarded")
          .eq("id", data.user.id)
          .single()
        
        // Close dialog and redirect directly
        onClose()
        if (profile?.is_onboarded) {
          router.push("/dashboard")
        } else {
          router.push("/onboarding")
        }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      if (error.message?.includes("Invalid login credentials")) {
        setErrors({ general: "Invalid email or password. Please try again." })
      } else {
        setErrors({ general: error.message || "An error occurred during login. Please try again." })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateResetForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setViewMode("reset-sent")
    } catch (error: any) {
      console.error("Password reset error:", error)
      if (error.message?.includes("User not found")) {
        setErrors({ email: "No account found with this email address." })
      } else {
        setErrors({ general: error.message || "An error occurred. Please try again." })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setSignupData({ firstName: "", lastName: "", email: "", mobileNumber: "", password: "" })
    setLoginData({ email: "", password: "" })
    setResetData({ email: "" })
    setErrors({})
    setShowPassword(false)
    setViewMode("auth")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleBackToAuth = () => {
    setViewMode("auth")
    setErrors({})
    setResetData({ email: "" })
  }

  const handleShowForgotPassword = () => {
    setViewMode("forgot-password")
    setErrors({})
    // Pre-fill email if user was trying to login
    if (loginData.email) {
      setResetData({ email: loginData.email })
    }
  }

  if (viewMode === "reset-sent") {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md sm:top-[20%] sm:translate-y-0 max-h-[90vh] overflow-y-auto">
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Check Your Email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to:
              <br />
              <span className="font-semibold text-gray-900">{resetData.email}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Click the link in the email to reset your password. The link will expire in 1 hour.
            </p>
            <div className="space-y-3">
              <Button onClick={handleBackToAuth} variant="outline" className="w-full">
                Back to Sign In
              </Button>
              <Button
                onClick={() => handleForgotPassword({ preventDefault: () => {} } as React.FormEvent)}
                variant="ghost"
                className="w-full text-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Resending...
                  </>
                ) : (
                  "Resend Email"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (viewMode === "forgot-password") {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md sm:top-[20%] sm:translate-y-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="sm" onClick={handleBackToAuth} className="p-1">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <DialogTitle className="text-2xl font-bold text-gray-900">Reset Password</DialogTitle>
            </div>
          </DialogHeader>

          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-gray-600">Enter your email address and we'll send you a link to reset your password.</p>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <Label htmlFor="reset-email" className="text-gray-700 font-medium">
                Email Address *
              </Label>
              <Input
                id="reset-email"
                type="email"
                value={resetData.email}
                onChange={(e) => handleResetChange("email", e.target.value)}
                className={`mt-1 ${errors.email ? "border-red-500" : ""}`}
                placeholder="your@email.com"
                disabled={isLoading}
                autoFocus
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending Reset Link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={handleBackToAuth}
              className="text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Remember your password? Sign in
            </button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md sm:top-[20%] sm:translate-y-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            {activeTab === "signup" ? "Join DharmaSaathi" : "Welcome Back"}
          </DialogTitle>
        </DialogHeader>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{errors.general}</p>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(value: string) => {
            setActiveTab(value as "signup" | "login")
            setErrors({})
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-50 p-1 rounded-lg">
            <TabsTrigger
              value="signup"
              className="text-sm font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700"
            >
              Create Account
            </TabsTrigger>
            <TabsTrigger
              value="login"
              className="text-sm font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-700"
            >
              Sign In
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signup">
            {/* Auth Method Selection */}
            {/* Only show email sign up, remove mobile option */}
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={signupData.firstName}
                    onChange={(e) => handleSignupChange("firstName", e.target.value)}
                    className={`mt-1 ${errors.firstName ? "border-red-500" : ""}`}
                    placeholder="First name"
                    disabled={isLoading}
                  />
                  {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>}
                </div>

                <div>
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={signupData.lastName}
                    onChange={(e) => handleSignupChange("lastName", e.target.value)}
                    className={`mt-1 ${errors.lastName ? "border-red-500" : ""}`}
                    placeholder="Last name"
                    disabled={isLoading}
                  />
                  {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="signup-email" className="text-gray-700 font-medium">
                  Email Address *
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={signupData.email}
                  onChange={(e) => handleSignupChange("email", e.target.value)}
                  className={`mt-1 ${errors.email ? "border-red-500" : ""}`}
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div>
                <Label className="text-gray-700 font-medium">Mobile Number *</Label>
                <div className="mt-1">
                  <PhoneInput
                    value={signupData.mobileNumber}
                    onChange={(val) => handleSignupChange("mobileNumber", val)}
                    disabled={isLoading}
                    error={!!errors.mobileNumber}
                  />
                </div>
                {errors.mobileNumber && <p className="mt-1 text-xs text-red-600">{errors.mobileNumber}</p>}
              </div>

              <div>
                <Label htmlFor="signup-password" className="text-gray-700 font-medium">
                  Password *
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={signupData.password}
                    onChange={(e) => handleSignupChange("password", e.target.value)}
                    className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
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
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="login">
            {/* Email login */}
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email" className="text-gray-700 font-medium">
                    Email Address *
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => handleLoginChange("email", e.target.value)}
                    className={`mt-1 ${errors.email ? "border-red-500" : ""}`}
                    placeholder="your@email.com"
                    disabled={isLoading}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <Label htmlFor="login-password" className="text-gray-700 font-medium">
                    Password *
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => handleLoginChange("password", e.target.value)}
                      className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
                      placeholder="Enter password"
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
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleShowForgotPassword}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

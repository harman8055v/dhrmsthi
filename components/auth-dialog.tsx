"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { Loader2, Eye, EyeOff, ArrowLeft, Mail, CheckCircle, Phone, User, Lock } from "lucide-react"

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  defaultMode: "signup" | "login"
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
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
  phone?: string
  password?: string
  confirmPassword?: string
  general?: string
}

type ViewMode = "auth" | "forgot-password" | "reset-sent"

export default function AuthDialog({ isOpen, onClose, defaultMode }: AuthDialogProps) {
  const [signupData, setSignupData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState(defaultMode)
  const [viewMode, setViewMode] = useState<ViewMode>("auth")
  const router = useRouter()

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, "")
    
    // If it doesn't start with +, and it's an Indian number (10 digits), add +91
    if (!cleaned.startsWith("+") && cleaned.length === 10 && cleaned.match(/^[6-9]/)) {
      cleaned = "+91" + cleaned
    }
    
    return cleaned
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

    const cleanPhone = signupData.phone.replace(/[^\d+]/g, "")
    if (!cleanPhone) {
      newErrors.phone = "Phone number is required"
    } else if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      newErrors.phone = "Please enter a valid phone number"
    }

    if (!signupData.password) {
      newErrors.password = "Password is required"
    } else if (signupData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (!signupData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match"
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
    if (field === "phone") {
      processedValue = formatPhoneNumber(value)
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
      // Sign up with email and password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Create minimal profile
        const { error: profileError } = await supabase
          .from("users")
          .insert({
            id: authData.user.id,
            email: signupData.email,
            phone: signupData.phone,
            first_name: signupData.firstName,
            last_name: signupData.lastName,
            full_name: `${signupData.firstName} ${signupData.lastName}`,
            onboarding_completed: true,
            is_onboarded: true,
          })

        if (profileError) {
          console.error("Profile creation error:", profileError)
          throw new Error("Failed to create profile")
        }

        // Sign in automatically
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: signupData.email,
          password: signupData.password,
        })

        if (!signInError) {
          onClose()
          window.location.replace("/dashboard")
        } else {
          alert("Account created! Please sign in manually.")
          window.location.replace("/login")
        }
      }

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateLoginForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (signInError) throw signInError

      if (data.user) {
        // Check if user has a profile
        const { data: profile } = await supabase
          .from("users")
          .select("id")
          .eq("id", data.user.id)
          .single()

        if (!profile) {
          // Create minimal profile if it doesn't exist
          await supabase.from("users").insert({
            id: data.user.id,
            email: data.user.email,
            onboarding_completed: true,
            is_onboarded: true,
          })
        }

        onClose()
        window.location.replace("/dashboard")
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
    setSignupData({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" })
    setLoginData({ email: "", password: "" })
    setResetData({ email: "" })
    setErrors({})
    setShowPassword(false)
    setShowConfirmPassword(false)
    setViewMode("auth")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleBackToAuth = () => {
    setViewMode("auth")
    setErrors({})
  }

  const handleShowForgotPassword = () => {
    setViewMode("forgot-password")
    setErrors({})
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        {viewMode === "auth" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Welcome to DharmaSaathi</DialogTitle>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signup" | "login")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
                <TabsTrigger value="login">Sign In</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  {errors.general && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{errors.general}</div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={signupData.firstName}
                        onChange={(e) => handleSignupChange("firstName", e.target.value)}
                        className={errors.firstName ? "border-red-500" : ""}
                        disabled={isLoading}
                      />
                      {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={signupData.lastName}
                        onChange={(e) => handleSignupChange("lastName", e.target.value)}
                        className={errors.lastName ? "border-red-500" : ""}
                        disabled={isLoading}
                      />
                      {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={signupData.email}
                        onChange={(e) => handleSignupChange("email", e.target.value)}
                        className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                        placeholder="your@email.com"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={signupData.phone}
                        onChange={(e) => handleSignupChange("phone", e.target.value)}
                        className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                        placeholder="+91 98765 43210"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={signupData.password}
                        onChange={(e) => handleSignupChange("password", e.target.value)}
                        className={`pl-10 ${errors.password ? "border-red-500" : ""}`}
                        placeholder="Min 6 characters"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={signupData.confirmPassword}
                        onChange={(e) => handleSignupChange("confirmPassword", e.target.value)}
                        className={`pl-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                        placeholder="Re-enter password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  {errors.general && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{errors.general}</div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="loginEmail">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="loginEmail"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => handleLoginChange("email", e.target.value)}
                        className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                        placeholder="your@email.com"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="loginPassword">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="loginPassword"
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => handleLoginChange("password", e.target.value)}
                        className={`pl-10 ${errors.password ? "border-red-500" : ""}`}
                        placeholder="Enter your password"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleShowForgotPassword}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </>
        )}

        {viewMode === "forgot-password" && (
          <>
            <DialogHeader>
              <button
                onClick={handleBackToAuth}
                className="absolute left-4 top-4 text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <DialogTitle className="text-2xl font-bold text-center">Reset Password</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {errors.general && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{errors.general}</div>
              )}
              
              <p className="text-sm text-gray-600">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetData.email}
                  onChange={(e) => handleResetChange("email", e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          </>
        )}

        {viewMode === "reset-sent" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Check Your Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <p className="text-gray-600">
                We've sent a password reset link to <strong>{resetData.email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Check your email and click the link to reset your password. The link will expire in 1 hour.
              </p>
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

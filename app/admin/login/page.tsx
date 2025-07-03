"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, Shield, AlertTriangle, ArrowLeft, Info } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface LoginData {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

// Helper function to check if role is admin
const isAdminRole = (role: string | null): boolean => {
  if (!role) return false
  const normalizedRole = role.toLowerCase()
  return normalizedRole === "admin" || normalizedRole === "super_admin" || normalizedRole === "superadmin"
}

export default function AdminLogin() {
  const [loginData, setLoginData] = useState<LoginData>({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkExistingAuth()
  }, [])

  const checkExistingAuth = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Session check error:", error)
        setIsCheckingAuth(false)
        return
      }

      if (session?.user) {
        // Check if user has admin role
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role, first_name, last_name, is_active")
          .eq("id", session.user.id)
          .single()

        if (userError) {
          console.error("User data fetch error:", userError)
          setDebugInfo({
            error: "User data fetch failed",
            details: userError,
            userId: session.user.id,
            email: session.user.email,
          })
          setIsCheckingAuth(false)
          return
        }

        if (userData?.is_active === false) {
          await supabase.auth.signOut()
          setErrors({ general: "Your account has been deactivated. Please contact support." })
          setIsCheckingAuth(false)
          return
        }

        if (isAdminRole(userData?.role)) {
          // User is already authenticated as admin, redirect to dashboard
          router.push("/admin")
          return
        } else {
          // User is authenticated but not admin, sign them out
          await supabase.auth.signOut()
          setDebugInfo({
            info: "User found but no admin role",
            userData,
            userId: session.user.id,
            email: session.user.email,
          })
        }
      }
    } catch (error) {
      console.error("Auth check error:", error)
      setDebugInfo({ error: "Auth check failed", details: error })
    } finally {
      setIsCheckingAuth(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!loginData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!loginData.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof LoginData, value: string) => {
    setLoginData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})
    setDebugInfo(null)

    try {
      console.log("Attempting login for:", loginData.email)

      // Attempt to sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (authError) {
        console.error("Auth error:", authError)
        throw authError
      }

      if (!authData.user) {
        throw new Error("Authentication failed - no user returned")
      }

      console.log("Authentication successful, checking user role...")

      // Check if user exists in users table and has admin role
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, role, first_name, last_name, is_active, created_at")
        .eq("id", authData.user.id)
        .single()

      console.log("User data query result:", { userData, userError })

      if (userError) {
        console.error("User data fetch error:", userError)
        setDebugInfo({
          error: "Failed to fetch user profile",
          details: userError,
          userId: authData.user.id,
          email: authData.user.email,
          suggestion:
            "The user might not exist in the users table. Please check if the user profile was created during registration.",
        })
        throw new Error("Failed to verify user profile. Please contact support.")
      }

      if (!userData) {
        setDebugInfo({
          error: "User profile not found",
          userId: authData.user.id,
          email: authData.user.email,
          suggestion: "User exists in auth but not in users table. Profile may need to be created.",
        })
        throw new Error("User profile not found. Please complete your registration first.")
      }

      // Check if user is active
      if (userData.is_active === false) {
        await supabase.auth.signOut()
        throw new Error("Your account has been deactivated. Please contact support.")
      }

      // Check if user has admin role (case-insensitive)
      if (!isAdminRole(userData.role)) {
        await supabase.auth.signOut()
        setDebugInfo({
          error: "Insufficient privileges",
          userData,
          currentRole: userData.role,
          expectedRoles: ["admin", "super_admin", "Admin", "Super_Admin"],
          suggestion:
            "User role is not set to admin or super_admin. Current role: " +
            (userData.role || "null") +
            ". Please contact a super admin to grant admin privileges.",
        })
        throw new Error(`Access denied. Admin privileges required. Current role: ${userData.role || "none"}`)
      }

      // Log admin login
      try {
        await supabase.from("login_history").insert({
          user_id: authData.user.id,
          login_type: "admin_login",
          ip_address: "unknown", // You can implement IP detection if needed
          user_agent: navigator.userAgent,
          success: true,
        })
      } catch (logError) {
        console.error("Failed to log admin login:", logError)
        // Don't fail the login for logging errors
      }

      // Successful admin login
      console.log("Admin login successful:", {
        userId: authData.user.id,
        email: authData.user.email,
        role: userData.role,
        name: `${userData.first_name} ${userData.last_name}`,
      })

      // Redirect to admin dashboard
      router.push("/admin")
    } catch (error: any) {
      console.error("Admin login error:", error)

      // Log failed login attempt
      try {
        if (loginData.email) {
          // Try to find user by email for logging purposes
          const { data: userForLog } = await supabase.from("users").select("id").eq("email", loginData.email).single()

          if (userForLog) {
            await supabase.from("login_history").insert({
              user_id: userForLog.id,
              login_type: "admin_login",
              ip_address: "unknown",
              user_agent: navigator.userAgent,
              success: false,
              failure_reason: error.message,
            })
          }
        }
      } catch (logError) {
        console.error("Failed to log failed login:", logError)
      }

      // Handle specific error types
      if (error.message?.includes("Invalid login credentials")) {
        setErrors({ general: "Invalid email or password. Please check your credentials and try again." })
      } else if (error.message?.includes("Access denied")) {
        setErrors({ general: error.message })
      } else if (error.message?.includes("deactivated")) {
        setErrors({ general: error.message })
      } else if (error.message?.includes("Email not confirmed")) {
        setErrors({ general: "Please verify your email address before logging in." })
      } else {
        setErrors({ general: error.message || "An error occurred during login. Please try again." })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-500" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="DharmaSaathi" width={150} height={50} className="h-12 w-auto" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
          </div>
          <p className="text-gray-600">Sign in to access the admin dashboard</p>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Debug Information:</p>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
                {debugInfo.suggestion && (
                  <p className="text-sm text-blue-600">
                    <strong>Suggestion:</strong> {debugInfo.suggestion}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Login Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">Enter your admin credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            {/* General Error Alert */}
            {errors.general && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`${errors.email ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="admin@dharmasaathi.com"
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`pr-10 ${errors.password ? "border-red-500 focus:border-red-500" : ""}`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Sign In as Admin
                  </>
                )}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>
                    This is a restricted area. All login attempts are logged and monitored. Unauthorized access is
                    prohibited.
                  </p>
                </div>
              </div>
            </div>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to DharmaSaathi
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          <p>© 2024 DharmaSaathi. All rights reserved.</p>
          <p className="mt-1">Admin Portal - Secure Access Required</p>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2, Shield, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminMiddlewareProps {
  children: React.ReactNode
}

interface AdminUser {
  id: string
  email: string
  role: string
  first_name: string
  last_name: string
  is_active: boolean
}

// Helper function to check if role is admin (case-insensitive)
const isAdminRole = (role: string | null): boolean => {
  if (!role) return false
  const normalizedRole = role.toLowerCase()
  return normalizedRole === "admin" || normalizedRole === "super_admin" || normalizedRole === "superadmin"
}

export default function AdminMiddleware({ children }: AdminMiddlewareProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAdminAccess()
  }, [pathname])

  const checkAdminAccess = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Skip auth check for login page
      if (pathname === "/admin/login") {
        setIsLoading(false)
        setIsAuthorized(true)
        return
      }

      // Check if user is authenticated
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        throw new Error("Authentication failed")
      }

      if (!session?.user) {
        console.log("No session found, redirecting to admin login")
        router.push("/admin/login")
        return
      }

      // Fetch user data and check admin role
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, role, first_name, last_name, is_active")
        .eq("id", session.user.id)
        .single()

      if (userError) {
        console.error("User data fetch error:", userError)
        throw new Error("Failed to verify admin access")
      }

      if (!userData) {
        throw new Error("User profile not found")
      }

      // Check if user is active
      if (userData.is_active === false) {
        await supabase.auth.signOut()
        throw new Error("Your account has been deactivated. Please contact support.")
      }

      // Check if user has admin role (case-insensitive)
      if (!isAdminRole(userData.role)) {
        await supabase.auth.signOut()
        console.log("User does not have admin role, redirecting to login. Current role:", userData.role)
        router.push("/admin/login")
        return
      }

      // User is authorized
      setAdminUser(userData)
      setIsAuthorized(true)
      console.log("Admin access granted:", {
        userId: userData.id,
        email: userData.email,
        role: userData.role,
      })
    } catch (error: any) {
      console.error("Admin access check error:", error)
      setError(error.message || "Failed to verify admin access")
      setIsAuthorized(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    checkAdminAccess()
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout error:", error)
      // Force redirect even if logout fails
      router.push("/admin/login")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-500" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleRetry} variant="outline">
              Retry
            </Button>
            <Button onClick={handleLogout}>Go to Login</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Shield className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unauthorized Access</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this area.</p>
          <Button onClick={() => router.push("/admin/login")}>Go to Login</Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

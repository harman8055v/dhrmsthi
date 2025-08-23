"use client"
import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import SafeHeaderProfileDropdown from "@/components/dashboard/safe-header-profile-dropdown"

// Page titles mapping
const pageTitles: Record<string, string> = {
  "/": "DharmaSaathi",
  "/dashboard": "Discover", 
  "/dashboard/profile": "Profile",
  "/dashboard/settings": "Edit Profile",
  "/dashboard/preferences": "Partner Preferences",
  "/dashboard/messages": "Messages",
  "/dashboard/matches": "Matches",
  "/dashboard/store": "DharmaSaathi Store",
  "/dashboard/referrals": "Referrals",
  "/dashboard/privacy": "Privacy Settings",
  "/dashboard/account-settings": "Account Settings",
  "/blog": "Spiritual Blog",
  "/about": "About Us",
  "/contact": "Support",
  "/terms-of-service": "Terms of Service",
  "/privacy-policy": "Privacy Policy",
  "/community-guidelines": "Community Guidelines", 
  "/cookie-policy": "Cookie Policy",
  "/onboarding": "Welcome",
  "/reset-password": "Reset Password",
  "/admin": "Admin Dashboard"
}

// Pages that shouldn't show back button
const noBackButtonPages = [
  "/",
  "/dashboard", 
  "/onboarding"
]

// Pages that should be hidden (don't show header)
const hiddenHeaderPages = [
  "/",
  "/onboarding",
  "/onboarding/welcome"
]

// Pages that have custom headers (hide native header)
const customHeaderPages = [
  "/dashboard/messages/"  // Chat pages have their own header
]

export default function NativeHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [pageTitle, setPageTitle] = useState("")
  const [showBackButton, setShowBackButton] = useState(false)





  useEffect(() => {
    // Get page title
    let title = pageTitles[pathname] || "DharmaSaathi"
    
    // Handle dynamic routes
    if (pathname.startsWith("/dashboard/messages/") && pathname !== "/dashboard/messages") {
      title = "Chat"
    } else if (pathname.startsWith("/blog/") && pathname !== "/blog") {
      title = "Article"
    } else if (pathname.startsWith("/admin/") && pathname !== "/admin") {
      title = "Admin"
    }
    
    setPageTitle(title)
    setShowBackButton(!noBackButtonPages.includes(pathname))
  }, [pathname])

  // Don't render header on certain pages
  if (hiddenHeaderPages.some(page => {
    if (page === "/") {
      return pathname === "/" // Exact match for home page only
    }
    return pathname.startsWith(page)
  })) {
    return null
  }

  // Don't render on pages with custom headers
  if (customHeaderPages.some(page => pathname.startsWith(page))) {
    return null
  }

  const handleBack = () => {
    try {
      router.back()
    } catch (error) {
      console.error("Navigation error:", error)
      // Fallback navigation
      if (pathname.startsWith("/dashboard")) {
        router.push("/dashboard")
      } else {
        router.push("/")
      }
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-12 px-4">
        {/* Back button or spacer */}
        <div className="w-10 flex justify-start">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full -ml-1"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
          )}
        </div>

        {/* Page title */}
        <div className="flex-1 text-center px-2">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {pageTitle}
          </h1>
        </div>

        {/* Right controls */}
        <div className="w-auto flex items-center gap-2">
          <div className="w-10 flex justify-end">
            <SafeHeaderProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  )
}
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Heart,
  Home,
  User,
  Settings,
  MessageCircle,
  ShoppingBag,
  LogOut,
  Shield,
  Users,
  Gift,
  ChevronDown,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuthContext } from "@/components/auth-provider"
import { getVerificationStatusText } from "@/lib/utils"
import Image from "next/image"
import { useQueryClient } from "@tanstack/react-query"
import { useUnreadCount } from "@/hooks/use-unread-count"

interface MobileNavProps {
  userProfile?: any
}

export default function MobileNav({ userProfile }: MobileNavProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [tappedItem, setTappedItem] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()
  const { signOut } = useAuthContext()
  const router = useRouter()
  const pathname = usePathname()
  // Check if user has messaging access
  const hasMessagingAccess = userProfile?.account_status && ['sparsh', 'sangam', 'samarpan'].includes(userProfile.account_status)
  
  // Only fetch unread count for users with messaging access
  const { totalUnreadCount } = useUnreadCount(hasMessagingAccess)

  // Prefetch dashboard routes for instant navigation
  useEffect(() => {
    const routes = [
      "/dashboard",
      "/dashboard/matches",
      "/dashboard/messages",
      "/dashboard/store",
      "/dashboard/profile",
    ]
    routes.forEach((r) => router.prefetch(r))

    // Check if mobile login user
    const isMobileLogin = typeof window !== 'undefined' && localStorage.getItem('isMobileLogin') === 'true';
    const mobileUserId = typeof window !== 'undefined' ? localStorage.getItem('mobileLoginUserId') : null;

    // Prefetch limited datasets so first navigation is instant
    qc.prefetchQuery({
      queryKey: ["profiles", "discover"],
      queryFn: () => {
        const url = isMobileLogin && mobileUserId 
          ? `/api/profiles/discover?limit=5&mobileUserId=${mobileUserId}`
          : "/api/profiles/discover?limit=5";
        return fetch(url, { credentials: "include" }).then((r) => r.json().then((d) => d.profiles || []))
      },
    })
    qc.prefetchQuery({
      queryKey: ["matches"],
      queryFn: () => fetch("/api/profiles/matches?limit=10", { credentials: "include" }).then((r) => r.json().then((d) => d.matches || [])),
    })
    qc.prefetchQuery({
      queryKey: ["conversations"],
      queryFn: () => fetch("/api/messages/conversations?limit=10", { credentials: "include" }).then((r) => r.json().then((d) => d.conversations || [])),
    })
  }, [router, qc])

  // Reset tappedItem when opening/closing dropdown
  const handleDropdownOpen = () => {
    setTappedItem(null)
    setIsProfileMenuOpen(true)
  }
  const handleDropdownClose = () => {
    setTappedItem(null)
    setIsProfileMenuOpen(false)
  }

  // Close dropdown on outside click
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleDropdownClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  // Use same verification logic as useAuth hook for consistency
  const isVerified = userProfile?.verification_status === 'verified'
  // Always show header for unverified users, hide only for verified users on dashboard home
  const showHeader = pathname !== "/dashboard" || !isVerified
  
  // Hide bottom navigation on chat pages
  const isChatPage = pathname?.startsWith("/dashboard/messages/") && pathname !== "/dashboard/messages"
  const showBottomNav = !isChatPage

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
    handleDropdownClose()
  }

  const handleNavItemClick = (href: string) => {
    setTappedItem(href)
    setTimeout(() => setTappedItem(null), 200)
    router.push(href)
    handleDropdownClose()
  }

  const allNavItems = [
    {
      icon: Home,
      label: "Home",
      href: "/dashboard",
      active: pathname === "/dashboard",
      color: "text-blue-500",
    },
    {
      icon: Heart,
      label: "Matches",
      href: "/dashboard/matches",
      active: pathname === "/dashboard/matches",
      color: "text-pink-500",
    },
    {
      icon: MessageCircle,
      label: "Messages",
      href: "/dashboard/messages",
      active: pathname === "/dashboard/messages",
      color: "text-green-500",
    },
    {
      icon: ShoppingBag,
      label: "Store",
      href: "/dashboard/store",
      active: pathname === "/dashboard/store",
      color: "text-purple-500",
    },
    {
      icon: User,
      label: "Profile",
      href: "/dashboard/profile",
      active: pathname === "/dashboard/profile",
      color: "text-orange-500",
    },
  ]

  // Filter nav items based on access
  const navItems = allNavItems.filter(item => {
    // Hide Messages tab for users without messaging access
    if (item.label === "Messages" && !hasMessagingAccess) {
      return false
    }
    return true
  })

  const settingsItems = [
    { icon: User, label: "Profile Settings", href: "/dashboard/settings" },
    { icon: Settings, label: "Account Settings", href: "/dashboard/account-settings" },
    { icon: Heart, label: "Partner Preferences", href: "/dashboard/preferences" },
    { icon: Shield, label: "Privacy & Safety", href: "/dashboard/privacy" },
    { icon: Users, label: "Referrals", href: "/dashboard/referrals" },
    { icon: Gift, label: "Premium", href: "/dashboard/store" },
  ]

  const getMainProfileImage = () => {
    if (userProfile?.user_photos && userProfile.user_photos.length > 0) {
      const url = userProfile.user_photos[0];
      // If already a full URL, use as is; otherwise, construct public bucket URL
      return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${url}`;
    }
    return null;
  };

  return (
    <>
      {/* Top Header - Minimal */}
      {showHeader && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-orange-50 to-pink-50 backdrop-blur-md border-b border-orange-100/50">
          <div className="flex items-center justify-between px-4 py-4">
            {/* Logo on left */}
            <div className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="DharmaSaathi" 
                width={140} 
                height={48} 
                priority
                style={{ height: "48px", width: "auto" }}
                className="h-12"
              />
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => isProfileMenuOpen ? handleDropdownClose() : handleDropdownOpen()}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-white/50 transition-all duration-200 group"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gradient-to-r from-orange-400 to-pink-400 shadow-lg group-hover:shadow-xl transition-all duration-200">
                    <Image
                      src={getMainProfileImage() || "/placeholder.svg"}
                      alt={userProfile?.first_name || "User"}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {userProfile?.fast_track_verification && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isProfileMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={handleDropdownClose} />
                  <div ref={dropdownRef} className="absolute top-full right-0 mt-2 w-64 bg-white backdrop-blur-md border border-orange-200 rounded-2xl shadow-2xl z-40 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {/* User Info */}
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-pink-50 border-b border-orange-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-200">
                          <Image
                            src={getMainProfileImage() || "/placeholder.svg"}
                            alt={userProfile?.first_name || "User"}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {userProfile?.first_name} {userProfile?.last_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {getVerificationStatusText(userProfile)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      {settingsItems.map((item, index) => (
                        <button
                          key={item.href}
                          onClick={() => handleNavItemClick(item.href)}
                          className="flex items-center gap-3 w-full px-3 py-3 text-left text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-xl transition-all duration-200 group"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-orange-100 to-pink-100 flex items-center justify-center group-hover:from-orange-200 group-hover:to-pink-200 transition-all duration-200">
                            <item.icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">{item.label}</span>
                        </button>
                      ))}

                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-3 w-full px-3 py-3 text-left text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-all duration-200">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Bottom Navigation - Hidden on chat pages */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-orange-100/50">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNavItemClick(item.href)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 relative ${
                  tappedItem === item.href ? "scale-95" : ""
                } ${item.active ? "text-orange-600 bg-orange-50" : "text-gray-600 hover:text-orange-600 hover:bg-orange-50/50"}`}
              >
                <div className="relative">
                  <item.icon className="w-6 h-6" />
                  {/* Unread messages badge */}
                  {item.label === "Messages" && totalUnreadCount > 0 && (
                    <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white px-1">
                        {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </>
  )
}

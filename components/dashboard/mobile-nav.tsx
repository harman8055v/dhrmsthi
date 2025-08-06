"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Heart,
  Home,
  User,
  MessageCircle,
  ShoppingBag,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useUnreadCount } from "@/hooks/use-unread-count"

interface MobileNavProps {
  userProfile?: any
}

export default function MobileNav({ userProfile }: MobileNavProps) {
  const [tappedItem, setTappedItem] = useState<string | null>(null)
  const qc = useQueryClient()
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




  
  // Hide bottom navigation on chat pages
  const isChatPage = pathname?.startsWith("/dashboard/messages/") && pathname !== "/dashboard/messages"
  const showBottomNav = !isChatPage

  const handleNavItemClick = (href: string) => {
    setTappedItem(href)
    setTimeout(() => setTappedItem(null), 200)
    router.push(href)
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



  return (
    <>

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

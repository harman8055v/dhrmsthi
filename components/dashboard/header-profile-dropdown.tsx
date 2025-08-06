"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, User, Shield, Users, Gift, LogOut, Settings, Heart } from "lucide-react"
import { useAuthContext } from "@/components/auth-provider"
import { getVerificationStatusText } from "@/lib/utils"
import Image from "next/image"

export default function HeaderProfileDropdown() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  
  // Get auth context - this should only be called within AuthProvider
  const { signOut, profile: userProfile } = useAuthContext()

  // Profile dropdown functions
  const handleDropdownOpen = () => {
    setIsProfileMenuOpen(true)
  }
  const handleDropdownClose = () => {
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

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
    handleDropdownClose()
  }

  const handleNavItemClick = (href: string) => {
    router.push(href)
    handleDropdownClose()
  }

  const getMainProfileImage = () => {
    if (userProfile?.user_photos && userProfile.user_photos.length > 0) {
      const url = userProfile.user_photos[0];
      return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${url}`;
    }
    return null;
  };

  const settingsItems = [
    { icon: User, label: "Profile Settings", href: "/dashboard/settings" },
    { icon: Settings, label: "Account Settings", href: "/dashboard/account-settings" },
    { icon: Heart, label: "Partner Preferences", href: "/dashboard/preferences" },
    { icon: Shield, label: "Privacy & Safety", href: "/dashboard/privacy" },
    { icon: Users, label: "Referrals", href: "/dashboard/referrals" },
    { icon: Gift, label: "Premium", href: "/dashboard/store" },
  ]

  if (!userProfile) return null

  return (
    <div className="relative">
      <button
        onClick={() => isProfileMenuOpen ? handleDropdownClose() : handleDropdownOpen()}
        className="flex items-center gap-1 p-1 rounded-full hover:bg-gray-100 transition-all duration-200 group"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-200">
            <Image
              src={getMainProfileImage() || "/placeholder.svg"}
              alt={userProfile?.first_name || "User"}
              width={32}
              height={32}
              className="w-full h-full object-cover"
            />
          </div>
          {userProfile?.fast_track_verification && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${isProfileMenuOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Profile Dropdown Menu */}
      {isProfileMenuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={handleDropdownClose} />
          <div ref={dropdownRef} className="absolute top-full right-0 mt-2 w-64 bg-white backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            {/* User Info */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-pink-50 border-b border-gray-100">
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
  )
}
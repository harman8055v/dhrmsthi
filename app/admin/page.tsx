"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  BarChart3,
  Shield,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Heart,
  Crown,
  TrendingUp,
  UserCheck,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Download,
  RefreshCw,
  AlertTriangle,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Send,
  ImageIcon,
  ZoomIn,
  X,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

interface UserType {
  id: string
  phone: string
  email: string | null
  email_verified: boolean | null
  mobile_verified: boolean | null
  full_name: string | null
  first_name: string | null
  last_name: string | null
  gender: string | null
  birthdate: string | null
  city_id: number | null
  state_id: number | null
  country_id: number | null
  profile_photo_url: string | null
  user_photos: string[] | null
  spiritual_org: string[] | null
  daily_practices: string[] | null
  diet: string | null
  temple_visit_freq: string | null
  artha_vs_moksha: string | null
  vanaprastha_interest: string | null
  favorite_spiritual_quote: string | null
  education: string | null
  profession: string | null
  annual_income: string | null
  marital_status: string | null
  super_likes_count: number | null
  swipe_count: number | null
  message_highlights_count: number | null
  is_onboarded: boolean | null
  is_verified: boolean | null
  account_status: string | null
  preferred_gender: string | null
  preferred_age_min: number | null
  preferred_age_max: number | null
  preferred_height_min: number | null
  preferred_height_max: number | null
  preferred_location: string | null
  preferred_diet: string | null
  preferred_profession: string | null
  preferred_education: string | null
  created_at: string | null
  updated_at: string | null
  daily_swipe_count: number | null
  daily_superlike_count: number | null
  last_swipe_date: string | null
  is_banned: boolean | null
  is_kyc_verified: boolean | null
  flagged_reason: string | null
  role: string | null
  mother_tongue: string | null
  about_me: string | null
  ideal_partner_notes: string | null
  verification_status: string | null
  height_ft: number | null
  height_in: number | null
  is_active: boolean | null
  profile_score: number | null
  profile_scored_at: string | null
  profile_scored_by: string | null
  // Additional computed fields
  city?: string
  state?: string
  country?: string
  referral_code?: string
  referral_count?: number
  premium_expires_at?: string
}

interface AdminStats {
  totalUsers: number
  verifiedUsers: number
  todaySignups: number
  pendingVerifications: number
  maleUsers: number
  femaleUsers: number
  completedProfiles: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface AdminUser {
  id: string
  email: string
  role: string
  first_name: string
  last_name: string
}

interface ContactMessage {
  id: number
  name: string
  email: string
  subject: string
  message: string
  status: string
  replied_by: string | null
  replied_at: string | null
  created_at: string
  updated_at: string
  replied_by_user?: {
    first_name: string
    last_name: string
    email: string
  } | null
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserType[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    todaySignups: 0,
    pendingVerifications: 0,
    maleUsers: 0,
    femaleUsers: 0,
    completedProfiles: 0,
  })
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [notificationModal, setNotificationModal] = useState<{
    open: boolean
    user: UserType | null
    message: string
    type: string
  }>({
    open: false,
    user: null,
    message: "",
    type: "profile_update",
  })

  // Profile scoring modal state
  const [scoringModal, setScoringModal] = useState<{
    open: boolean
    user: UserType | null
    score: number
    action: 'verify' | 'reject' | null
  }>({
    open: false,
    user: null,
    score: 5,
    action: null
  })

  // New state for enhanced filtering and sorting
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [genderFilter, setGenderFilter] = useState("all")
  const [photoFilter, setPhotoFilter] = useState("all")
  const [profileCompletionFilter, setProfileCompletionFilter] = useState("all")
  const [verificationFilter, setVerificationFilter] = useState("all")
  const [ageRangeFilter, setAgeRangeFilter] = useState("all")

  // Image zoom modal state
  const [imageZoomModal, setImageZoomModal] = useState<{
    open: boolean
    images: string[]
    currentIndex: number
    userName: string
  }>({
    open: false,
    images: [],
    currentIndex: 0,
    userName: "",
  })

  // Contact messages state
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [contactMessagesLoading, setContactMessagesLoading] = useState(false)
  const [contactMessagesPagination, setContactMessagesPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [contactMessagesFilter, setContactMessagesFilter] = useState("all")
  const [contactMessagesSearch, setContactMessagesSearch] = useState("")

  useEffect(() => {
    fetchCurrentAdminUser()
    if (activeTab === "overview") {
      fetchAdminData(1, true) // Include stats for overview
    } else if (activeTab === "contact-messages") {
      fetchContactMessages(1)
    } else {
      fetchAdminData(1, false)
    }
  }, [
    activeTab,
    filterStatus,
    searchTerm,
    sortBy,
    sortOrder,
    genderFilter,
    photoFilter,
    profileCompletionFilter,
    verificationFilter,
    ageRangeFilter,
  ])

  useEffect(() => {
    if (activeTab === "contact-messages") {
      fetchContactMessages(1)
    }
  }, [contactMessagesFilter, contactMessagesSearch])

  const fetchCurrentAdminUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: userData } = await supabase
          .from("users")
          .select("id, email, role, first_name, last_name")
          .eq("id", session.user.id)
          .single()

        if (userData) {
          setAdminUser(userData)
        }
      }
    } catch (error) {
      console.error("Error fetching admin user:", error)
    }
  }

  const fetchAdminData = async (page = 1, includeStats = false) => {
    setUsersLoading(true)
    if (includeStats) {
      setStatsLoading(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        filter: filterStatus,
        search: searchTerm,
        include_stats: includeStats.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
        gender_filter: genderFilter,
        photo_filter: photoFilter,
        profile_completion_filter: profileCompletionFilter,
        verification_filter: verificationFilter,
        age_range_filter: ageRangeFilter,
      })

      const response = await fetch(`/api/admin/dashboard?${params}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("Dashboard data received:", {
        usersCount: data.users?.length,
        pagination: data.pagination,
        stats: data.stats,
        success: data.success,
      })

      setUsers(data.users || [])
      setPagination(data.pagination)
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Dashboard data fetch error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch admin data"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setUsersLoading(false)
      setStatsLoading(false)
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchAdminData(newPage, activeTab === "overview")
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/admin/login"
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/admin/login"
    }
  }

  const handleUserAction = async (userId: string, action: string, value?: any) => {
    setActionLoading(userId + action)
    try {
      let updateData: any = {}

      switch (action) {
        case "deactivate":
          updateData = { is_active: false, deactivated_at: new Date().toISOString() }
          break
        case "activate":
          updateData = { is_active: true, deactivated_at: null }
          break
        case "verify":
          updateData = { verification_status: "verified", is_verified: true }
          break
        case "reject":
          updateData = { verification_status: "rejected", is_verified: false }
          break
        case "score":
          updateData = { 
            profile_score: value.score,
            profile_scored_by: adminUser?.id,
            profile_scored_at: new Date().toISOString()
          }
          break
        case "verify_with_score":
          updateData = { 
            verification_status: "verified", 
            is_verified: true,
            profile_score: value.score,
            profile_scored_by: adminUser?.id,
            profile_scored_at: new Date().toISOString()
          }
          break
        case "reject_with_score":
          updateData = { 
            verification_status: "rejected", 
            is_verified: false,
            profile_score: value.score,
            profile_scored_by: adminUser?.id,
            profile_scored_at: new Date().toISOString()
          }
          break
        default:
          return
      }

      const { error } = await supabase.from("users").update(updateData).eq("id", userId)

      if (error) throw error

      toast({
        title: "Success",
        description: `User ${action.replace('_with_score', '')} completed successfully${action.includes('score') ? ` with score ${value?.score}/10` : ''}`,
      })

      // Refresh current page
      await fetchAdminData(pagination.page, activeTab === "overview")

      // Update selected user if it's the same one
      if (selectedUser?.id === userId) {
        const updatedUser = users.find((u) => u.id === userId)
        if (updatedUser) {
          setSelectedUser({ ...updatedUser, ...updateData })
        }
      }
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const openScoringModal = (user: UserType, action: 'verify' | 'reject') => {
    setScoringModal({
      open: true,
      user,
      score: user.profile_score || 5,
      action
    })
  }

  const handleScoringSubmit = async () => {
    if (!scoringModal.user || !scoringModal.action) return

    const actionType = scoringModal.action === 'verify' ? 'verify_with_score' : 'reject_with_score'
    await handleUserAction(scoringModal.user.id, actionType, { score: scoringModal.score })
    
    setScoringModal({
      open: false,
      user: null,
      score: 5,
      action: null
    })
  }

  const handleSendNotification = async () => {
    if (!notificationModal.user || !notificationModal.message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/notify-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: notificationModal.user.id,
          message: notificationModal.message,
          type: notificationModal.type,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send notification")
      }

      toast({
        title: "Success",
        description: "Notification sent successfully",
      })

      setNotificationModal({ open: false, user: null, message: "", type: "profile_update" })
    } catch (error) {
      console.error("Error sending notification:", error)
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      })
    }
  }

  const openNotificationModal = (user: UserType, type = "profile_update") => {
    const defaultMessages = {
      profile_update:
        "Hi! To complete your profile verification, please update your profile with complete information including photos, about section, and partner preferences.",
      verification_pending:
        "Your profile is currently under review. We'll notify you once the verification is complete.",
      verification_rejected:
        "Your profile verification needs some updates. Please review and update your profile information.",
    }

    setNotificationModal({
      open: true,
      user,
      message: defaultMessages[type as keyof typeof defaultMessages] || "",
      type,
    })
  }

  const fetchUserDetails = async (user: UserType) => {
    setSelectedUser(user)
  }

  const handleEditUser = async (updatedData: Partial<UserType>) => {
    if (!editingUser) return

    setActionLoading("edit")
    try {
      const { error } = await supabase.from("users").update(updatedData).eq("id", editingUser.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "User profile updated successfully",
      })

      setEditingUser(null)
      await fetchAdminData(pagination.page, activeTab === "overview")
    } catch (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user profile",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const exportData = async () => {
    try {
      // Fetch all users for export (without pagination)
      const response = await fetch(`/api/admin/dashboard?limit=10000&filter=${filterStatus}&search=${searchTerm}`, {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) throw new Error("Failed to fetch data for export")

      const data = await response.json()
      const allUsers = data.users || []

      const csvContent = [
        ["Name", "Email", "Phone", "Gender", "Location", "Status", "Verification", "Joined", "Last Login"].join(","),
        ...allUsers.map((user: UserType) =>
          [
            `${user.first_name || ""} ${user.last_name || ""}`,
            user.email || "",
                          user.phone || "",
            user.gender || "",
                          "Location not available",
            "Basic",
            user.verification_status || "pending",
            user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A",
            "Never", // Removed last_login_at field
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `dharmasaathi-users-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "User data exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800"
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "basic":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateAge = (birthdate: string | null) => {
    if (!birthdate) return "N/A"
    try {
      const today = new Date()
      const birth = new Date(birthdate)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age.toString()
    } catch {
      return "N/A"
    }
  }



  const getValidPhotos = (photos: string[] | null) => {
    if (!photos || !Array.isArray(photos)) return []
    return photos.filter(photo => photo && photo.trim() !== '' && photo !== 'null' && photo !== 'undefined')
  }

  const getProfileCompletionScore = (user: UserType) => {
    let score = 0
    const totalFields = 16

    const fields = [
      user.first_name,
      user.last_name,
      user.email,
      user.phone,
      user.birthdate,
      user.gender,
      user.education,
      user.profession,
      user.about_me,
      user.ideal_partner_notes,
      user.height_ft,
      user.height_in,
      user.marital_status,
      user.diet,
      user.annual_income,
      user.temple_visit_freq,
    ]

    fields.forEach((field) => {
      if (field && field.toString().trim() !== "") score += 1
    })

    const validPhotos = getValidPhotos(user.user_photos)
    if (validPhotos.length > 0) score += 1
    
    // Handle daily_practices which might be a string or array
    let hasDailyPractices = false;
    if (user.daily_practices) {
      if (Array.isArray(user.daily_practices)) {
        hasDailyPractices = user.daily_practices.length > 0;
      } else if (typeof user.daily_practices === 'string') {
        try {
          const practices = JSON.parse(user.daily_practices);
          hasDailyPractices = Array.isArray(practices) && practices.length > 0;
        } catch {
          hasDailyPractices = user.daily_practices && user.daily_practices.length > 0;
        }
      }
    }
    if (hasDailyPractices) score += 1

    return Math.round((score / totalFields) * 100)
  }

  const openImageZoom = (images: string[], startIndex: number, userName: string) => {
    const validImages = images.filter((img) => img && img.trim() !== "")
    if (validImages.length === 0) return

    setImageZoomModal({
      open: true,
      images: validImages,
      currentIndex: startIndex,
      userName,
    })
  }

  const closeImageZoom = () => {
    setImageZoomModal({
      open: false,
      images: [],
      currentIndex: 0,
      userName: "",
    })
  }

  const nextImage = () => {
    setImageZoomModal((prev) => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length,
    }))
  }

  const prevImage = () => {
    setImageZoomModal((prev) => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1,
    }))
  }

  // Loading skeleton components
  const StatsCardSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  )

  const UserCardSkeleton = () => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
      <Skeleton className="h-8 w-8" />
    </div>
  )

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin Dashboard Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => fetchAdminData(pagination.page, activeTab === "overview")} className="mr-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      <main className="pt-20 pb-32 min-h-screen">
        <div className="px-4 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 mb-1 flex items-center gap-2">
                Admin Dashboard
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {adminUser?.role || "Admin"}
                </Badge>
              </h1>
              <p className="text-sm text-gray-600">Manage users, verifications, and platform analytics</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAdminData(pagination.page, activeTab === "overview")}
                disabled={usersLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${usersLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              {/* Admin User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {adminUser ? `${adminUser.first_name} ${adminUser.last_name}` : "Admin"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {adminUser ? `${adminUser.first_name} ${adminUser.last_name}` : "Admin User"}
                      </p>
                      <p className="text-xs text-muted-foreground">{adminUser?.email}</p>
                      <Badge variant="outline" className="text-xs w-fit">
                        {adminUser?.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Verification</span>
            </TabsTrigger>
            <TabsTrigger value="contact-messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Support</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statsLoading ? (
                <>
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                </>
              ) : (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">+{stats.todaySignups} today</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.verifiedUsers.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalUsers > 0 ? ((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1) : 0}% verified
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Verified</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.verifiedUsers.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalUsers > 0 ? ((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
                        verified
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Basic Users</CardTitle>
                      <Crown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.completedProfiles.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalUsers > 0 ? ((stats.completedProfiles / stats.totalUsers) * 100).toFixed(1) : 0}% complete
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statsLoading ? (
                <>
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                  <StatsCardSkeleton />
                </>
              ) : (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.pendingVerifications.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Awaiting review</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Gender Split</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.maleUsers}M / {stats.femaleUsers}F
                      </div>
                      <p className="text-xs text-muted-foreground">Male / Female ratio</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Complete Profiles</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.completedProfiles.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalUsers > 0 ? ((stats.completedProfiles / stats.totalUsers) * 100).toFixed(1) : 0}%
                        complete
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">0</div>
                      <p className="text-xs text-muted-foreground">Feature not available</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent User Activity</CardTitle>
                <CardDescription>Latest user registrations and profile updates</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-48 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="text-right">
                          <Skeleton className="h-4 w-16 mb-1" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.slice(0, 8).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={(() => {
                              const validPhotos = getValidPhotos(user.user_photos)
                              return validPhotos.length > 0 ? validPhotos[0] : undefined
                            })()} />
                            <AvatarFallback>
                              {user.first_name?.[0] || "U"}
                              {user.last_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.first_name || "Unknown"} {user.last_name || "User"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {user.city && user.state ? `${user.city}, ${user.state}` : "Location not set"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(user.verification_status)}>
                            {user.verification_status || "pending"}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search users by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full sm:w-48">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="pending">Pending Verification</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="basic">Basic Users</SelectItem>
                        <SelectItem value="incomplete">Incomplete Profiles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Additional Filters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Select value={genderFilter} onValueChange={setGenderFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Genders</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={photoFilter} onValueChange={setPhotoFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Photos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="has_photos">Has Photos</SelectItem>
                        <SelectItem value="no_photos">No Photos</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={ageRangeFilter} onValueChange={setAgeRangeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Age Range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Ages</SelectItem>
                        <SelectItem value="18-25">18-25 years</SelectItem>
                        <SelectItem value="26-30">26-30 years</SelectItem>
                        <SelectItem value="31-35">31-35 years</SelectItem>
                        <SelectItem value="36-40">36-40 years</SelectItem>
                        <SelectItem value="40+">40+ years</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={profileCompletionFilter} onValueChange={setProfileCompletionFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Profile Completion" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Profiles</SelectItem>
                        <SelectItem value="complete">Complete (80%+)</SelectItem>
                        <SelectItem value="incomplete">Incomplete (&lt;80%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Options */}
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium">Sort by:</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">Join Date</SelectItem>
                        <SelectItem value="verification_status">Verification Status</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "asc" | "desc")}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Descending</SelectItem>
                        <SelectItem value="asc">Ascending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Users ({pagination.total.toLocaleString()})
                    {usersLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  </CardTitle>
                  <CardDescription>
                    Showing {users.length} of {pagination.total} users (Page {pagination.page} of{" "}
                    {pagination.totalPages})
                  </CardDescription>
                </div>
                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev || usersLoading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext || usersLoading}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <UserCardSkeleton key={i} />
                    ))}
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No users found matching the current filters</p>
                    <p className="text-sm mt-2">Try adjusting your filter criteria</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={(() => {
                              const validPhotos = getValidPhotos(user.user_photos)
                              return validPhotos.length > 0 ? validPhotos[0] : undefined
                            })()} />
                            <AvatarFallback>
                              {user.first_name?.[0] || "U"}
                              {user.last_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">
                                {user.first_name || "Unknown"} {user.last_name || "User"}
                              </h3>
                              {user.is_active === false && <Badge variant="destructive">Inactive</Badge>}
                              {!user.is_onboarded && <Badge variant="outline">Incomplete</Badge>}
                              {user.role?.toLowerCase() === "admin" && (
                                <Badge className="bg-red-100 text-red-800">Admin</Badge>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email || "No email"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {user.phone || "No phone"}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {user.city && user.state ? `${user.city}, ${user.state}` : "Location not set"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className={getStatusColor(user.verification_status)}>
                                {user.verification_status || "pending"}
                              </Badge>
                              {user.gender && <Badge variant="outline">{user.gender}</Badge>}
                              {user.birthdate && <Badge variant="outline">{calculateAge(user.birthdate)} years</Badge>}
                              <Badge variant="outline" className="text-xs">
                                {getProfileCompletionScore(user)}% complete
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={actionLoading?.startsWith(user.id)}>
                              {actionLoading?.startsWith(user.id) ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <MoreVertical className="w-4 h-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => fetchUserDetails(user)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openNotificationModal(user, "profile_update")}>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Send Notification
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.verification_status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => openScoringModal(user, "verify")}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve with Score
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openScoringModal(user, "reject")}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject with Score
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuSeparator />
                            {user.is_active !== false ? (
                              <DropdownMenuItem onClick={() => handleUserAction(user.id, "deactivate")}>
                                <Ban className="w-4 h-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleUserAction(user.id, "activate")}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            {/* Enhanced Filters for Verification Tab */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Verification Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={photoFilter} onValueChange={setPhotoFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Photos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="has_photos">Has Photos</SelectItem>
                      <SelectItem value="no_photos">No Photos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={profileCompletionFilter} onValueChange={setProfileCompletionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Profile Completion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Profiles</SelectItem>
                      <SelectItem value="complete">Complete (80%+)</SelectItem>
                      <SelectItem value="incomplete">Incomplete (&lt;80%)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={ageRangeFilter} onValueChange={setAgeRangeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Age Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ages</SelectItem>
                      <SelectItem value="18-25">18-25 years</SelectItem>
                      <SelectItem value="26-30">26-30 years</SelectItem>
                      <SelectItem value="31-35">31-35 years</SelectItem>
                      <SelectItem value="36-40">36-40 years</SelectItem>
                      <SelectItem value="40+">40+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    User Verification ({pagination.total}){usersLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  </CardTitle>
                  <CardDescription>Review and manage user verification requests</CardDescription>
                </div>
                {/* Pagination Controls for Verification */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev || usersLoading}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext || usersLoading}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-16 w-16 rounded-full" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Skeleton className="h-5 w-40" />
                              <Skeleton className="h-4 w-20" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Skeleton className="h-3 w-32 mb-1" />
                                <Skeleton className="h-3 w-28" />
                              </div>
                              <div>
                                <Skeleton className="h-3 w-36 mb-1" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Skeleton className="h-8 w-32" />
                          <Skeleton className="h-8 w-32" />
                          <div className="flex gap-2">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-8 w-20" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={(() => {
                              const validPhotos = getValidPhotos(user.user_photos)
                              return validPhotos.length > 0 ? validPhotos[0] : undefined
                            })()} />
                            <AvatarFallback className="text-lg">
                              {user.first_name?.[0] || "U"}
                              {user.last_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium text-lg">
                                {user.first_name || "Unknown"} {user.last_name || "User"}
                              </h3>
                              {!user.is_onboarded && <Badge variant="outline">Incomplete Profile</Badge>}
                              <Badge className={getStatusColor(user.verification_status)}>
                                {user.verification_status || "pending"}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <p>
                                  <Mail className="w-3 h-3 inline mr-1" />
                                  {user.email}
                                </p>
                                <p>
                                  <Phone className="w-3 h-3 inline mr-1" />
                                  {user.phone || "No phone"}
                                </p>
                              </div>
                              <div>
                                <p>
                                  <MapPin className="w-3 h-3 inline mr-1" />
                                  {user.city && user.state ? `${user.city}, ${user.state}` : "Location not set"}
                                </p>
                                <p>
                                  <Calendar className="w-3 h-3 inline mr-1" />
                                  {user.birthdate ? `${calculateAge(user.birthdate)} years` : "Age not set"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{user.gender || "Not specified"}</Badge>
                              <Badge variant="outline">{user.education || "Education not set"}</Badge>
                              <Badge variant="outline">{user.profession || "Profession not set"}</Badge>
                              <Badge variant="outline" className="text-xs">
                                {getProfileCompletionScore(user)}% complete
                              </Badge>
                              {getValidPhotos(user.user_photos).length > 0 && (
                                <Badge variant="outline" className="text-green-600">
                                  <ImageIcon className="w-3 h-3 mr-1" />
                                  {getValidPhotos(user.user_photos).length} photo{getValidPhotos(user.user_photos).length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                              Submitted {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline" onClick={() => fetchUserDetails(user)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Profile
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openNotificationModal(user, "profile_update")}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Request Update
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserAction(user.id, "reject")}
                              disabled={actionLoading === user.id + "reject"}
                            >
                              {actionLoading === user.id + "reject" ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4 mr-2" />
                              )}
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleUserAction(user.id, "verify")}
                              disabled={actionLoading === user.id + "verify"}
                            >
                              {actionLoading === user.id + "verify" ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {users.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No users found matching the current filters</p>
                        <p className="text-sm mt-2">Try adjusting your filter criteria</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Demographics</CardTitle>
                  <CardDescription>Breakdown of user characteristics</CardDescription>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <Skeleton className="h-4 w-20" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-2 w-24 rounded-full" />
                            <Skeleton className="h-4 w-8" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Male Users</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${stats.totalUsers > 0 ? (stats.maleUsers / stats.totalUsers) * 100 : 0}%`,
                              }}
                            ></div>
                          </div>
                          <Badge variant="outline">{stats.maleUsers}</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Female Users</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-pink-500 h-2 rounded-full"
                              style={{
                                width: `${stats.totalUsers > 0 ? (stats.femaleUsers / stats.totalUsers) * 100 : 0}%`,
                              }}
                            ></div>
                          </div>
                          <Badge variant="outline">{stats.femaleUsers}</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Verified Users</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${stats.totalUsers > 0 ? (stats.verifiedUsers / stats.totalUsers) * 100 : 0}%`,
                              }}
                            ></div>
                          </div>
                          <Badge variant="outline">{stats.verifiedUsers}</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Premium Users</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full"
                              style={{
                                width: `${stats.totalUsers > 0 ? (stats.completedProfiles / stats.totalUsers) * 100 : 0}%`,
                              }}
                            ></div>
                          </div>
                          <Badge variant="outline">{stats.completedProfiles}</Badge>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Status Distribution</CardTitle>
                  <CardDescription>User account types and verification status</CardDescription>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Verified</span>
                        <Badge className="bg-green-100 text-green-800">{stats.verifiedUsers}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Pending</span>
                        <Badge className="bg-yellow-100 text-yellow-800">{stats.pendingVerifications}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Rejected</span>
                        <Badge className="bg-red-100 text-red-800">
                          {users.filter((u) => u.verification_status === "rejected").length}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Complete Profiles</span>
                        <Badge className="bg-blue-100 text-blue-800">{stats.completedProfiles}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Incomplete Profiles</span>
                        <Badge className="bg-gray-100 text-gray-800">
                          {stats.totalUsers - stats.completedProfiles}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </main>

      {/* Enhanced User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete User Profile</DialogTitle>
            <DialogDescription>
              Comprehensive profile information for {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage
                          src={(() => {
                            if (selectedUser.profile_photo_url) return selectedUser.profile_photo_url
                            const validPhotos = getValidPhotos(selectedUser.user_photos)
                            return validPhotos.length > 0 ? validPhotos[0] : "/placeholder.svg"
                          })()}
                        />
                        <AvatarFallback className="text-lg">
                          {selectedUser.first_name?.[0] || "U"}
                          {selectedUser.last_name?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">
                          {selectedUser.first_name || "Unknown"} {selectedUser.last_name || "User"}
                        </h3>
                        <p className="text-gray-600">
                          {selectedUser.birthdate
                            ? `${calculateAge(selectedUser.birthdate)} years old`
                            : "Age not specified"}
                          {selectedUser.gender && `, ${selectedUser.gender}`}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge className={getStatusColor(selectedUser.verification_status)}>
                            {selectedUser.verification_status || "pending"}
                          </Badge>
                          {selectedUser.account_status === 'premium' && (
                            <Badge className="bg-purple-100 text-purple-800">Premium</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{selectedUser.email || "No email"}</span>
                        {selectedUser.email_verified && <CheckCircle className="w-3 h-3 text-green-500" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{selectedUser.phone || "No phone"}</span>
                        {selectedUser.mobile_verified && <CheckCircle className="w-3 h-3 text-green-500" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>
                          {selectedUser.city && selectedUser.state
                            ? `${selectedUser.city}, ${selectedUser.state}`
                            : "Location not set"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>Joined {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Profile Completion</span>
                        <span className="text-sm text-gray-600">{getProfileCompletionScore(selectedUser)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${getProfileCompletionScore(selectedUser)}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Mother Tongue:</span>
                        <p className="text-gray-600">{selectedUser.mother_tongue || "Not specified"}</p>
                      </div>
                      <div>
                        <span className="font-medium">Diet:</span>
                        <p className="text-gray-600">{selectedUser.diet || "Not specified"}</p>
                      </div>
                      <div>
                        <span className="font-medium">Smoking:</span>
                        <p className="text-gray-600">{selectedUser.smoking ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <span className="font-medium">Drinking:</span>
                        <p className="text-gray-600">{selectedUser.drinking ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <span className="font-medium">Vanaprastha Interest:</span>
                        <p className="text-gray-600">{selectedUser.vanaprastha_interest || "Not specified"}</p>
                      </div>
                      <div>
                        <span className="font-medium">Artha vs Moksha:</span>
                        <p className="text-gray-600">{selectedUser.artha_vs_moksha || "Not specified"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Middle Column - Professional & Spiritual */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Professional Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Education:</span>
                      <p className="text-gray-600">{selectedUser.education || "Not specified"}</p>
                    </div>
                    <div>
                      <span className="font-medium">Profession:</span>
                      <p className="text-gray-600">{selectedUser.profession || "Not specified"}</p>
                    </div>
                    <div>
                      <span className="font-medium">Annual Income:</span>
                      <p className="text-gray-600">{selectedUser.annual_income || "Not specified"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Spiritual Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Temple Visit Frequency:</span>
                      <p className="text-gray-600">{selectedUser.temple_visit_freq || "Not specified"}</p>
                    </div>
                    <div>
                      <span className="font-medium">Daily Practices:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(() => {
                          let practices = [];
                          if (selectedUser.daily_practices) {
                            if (Array.isArray(selectedUser.daily_practices)) {
                              practices = selectedUser.daily_practices;
                            } else if (typeof selectedUser.daily_practices === 'string') {
                              try {
                                practices = JSON.parse(selectedUser.daily_practices);
                              } catch {
                                practices = [selectedUser.daily_practices];
                              }
                            }
                          }
                          
                          return practices.length > 0 ? (
                            practices.map((practice, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {practice}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-gray-600">Not specified</p>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Spiritual Organizations:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedUser.spiritual_org && Array.isArray(selectedUser.spiritual_org) && selectedUser.spiritual_org.length > 0 ? (
                          selectedUser.spiritual_org.map((org: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {org}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-gray-600">Not specified</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Favorite Spiritual Quote:</span>
                      <p className="text-gray-600 italic">{selectedUser.favorite_spiritual_quote || "Not specified"}</p>
                    </div>
                  </CardContent>
                </Card>

                {selectedUser.ideal_partner_notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Looking For</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="text-gray-700 leading-relaxed">{selectedUser.ideal_partner_notes}</p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">Super Likes:</span>
                        <p className="text-gray-600">{selectedUser.super_likes_count || 0}</p>
                      </div>
                      <div>
                        <span className="font-medium">Swipe Count:</span>
                        <p className="text-gray-600">{selectedUser.swipe_count || 0}</p>
                      </div>
                      <div>
                        <span className="font-medium">Referral Code:</span>
                        <p className="text-gray-600">{selectedUser.referral_code || "Not generated"}</p>
                      </div>
                      <div>
                        <span className="font-medium">Referrals:</span>
                        <p className="text-gray-600">{selectedUser.referral_count || 0}</p>
                      </div>
                    </div>
                    {selectedUser.premium_expires_at && (
                      <div>
                        <span className="font-medium">Premium Expires:</span>
                        <p className="text-gray-600">
                          {new Date(selectedUser.premium_expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - About, Photos, Actions */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">About Me</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedUser.about_me || "No information provided"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Partner Expectations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedUser.ideal_partner_notes || "No information provided"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      User Photos
                      {getValidPhotos(selectedUser.user_photos).length > 0 && (
                        <Badge variant="outline">
                          {getValidPhotos(selectedUser.user_photos).length} photo{getValidPhotos(selectedUser.user_photos).length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getValidPhotos(selectedUser.user_photos).length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {getValidPhotos(selectedUser.user_photos).map((photo, index) => (
                          <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                            onClick={() =>
                              openImageZoom(
                                getValidPhotos(selectedUser.user_photos),
                                index,
                                `${selectedUser.first_name} ${selectedUser.last_name}`,
                              )
                            }
                          >
                            <Image
                              src={photo || "/placeholder.svg"}
                              alt={`Photo ${index + 1}`}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No photos uploaded</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Admin Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingUser(selectedUser)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openNotificationModal(selectedUser, "profile_update")}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Send Notification
                      </Button>
                      {selectedUser.verification_status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleUserAction(selectedUser.id, "verify")}
                            disabled={actionLoading === selectedUser.id + "verify"}
                          >
                            {actionLoading === selectedUser.id + "verify" ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Approve Verification
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleUserAction(selectedUser.id, "reject")}
                            disabled={actionLoading === selectedUser.id + "reject"}
                          >
                            {actionLoading === selectedUser.id + "reject" ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-2" />
                            )}
                            Reject Verification
                          </Button>
                        </>
                      )}
                      {selectedUser.account_status === 'premium' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(selectedUser.id, "removePremium")}
                          disabled={actionLoading === selectedUser.id + "removePremium"}
                        >
                          {actionLoading === selectedUser.id + "removePremium" ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Crown className="w-4 h-4 mr-2" />
                          )}
                          Remove Premium
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleUserAction(selectedUser.id, "makePremium")}
                          disabled={actionLoading === selectedUser.id + "makePremium"}
                        >
                          {actionLoading === selectedUser.id + "makePremium" ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Crown className="w-4 h-4 mr-2" />
                          )}
                          Make Premium
                        </Button>
                      )}
                      {selectedUser.is_active !== false ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUserAction(selectedUser.id, "deactivate")}
                          disabled={actionLoading === selectedUser.id + "deactivate"}
                        >
                          {actionLoading === selectedUser.id + "deactivate" ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Ban className="w-4 h-4 mr-2" />
                          )}
                          Deactivate Account
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleUserAction(selectedUser.id, "activate")}
                          disabled={actionLoading === selectedUser.id + "activate"}
                        >
                          {actionLoading === selectedUser.id + "activate" ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Activate Account
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Zoom Modal */}
      <Dialog open={imageZoomModal.open} onOpenChange={closeImageZoom}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0">
          <div className="relative">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium">{imageZoomModal.userName}</h3>
                <p className="text-sm opacity-75">
                  Photo {imageZoomModal.currentIndex + 1} of {imageZoomModal.images.length}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeImageZoom}
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Image */}
            <div className="relative aspect-square max-h-[80vh]">
              {imageZoomModal.images[imageZoomModal.currentIndex] ? (
                <Image
                  src={imageZoomModal.images[imageZoomModal.currentIndex]}
                  alt={`Photo ${imageZoomModal.currentIndex + 1}`}
                  fill
                  className="object-contain bg-black"
                  onError={(e) => {
                    console.error('Failed to load image:', imageZoomModal.images[imageZoomModal.currentIndex])
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                  <div className="text-center text-white">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Image not available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            {imageZoomModal.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-75"
                  onClick={prevImage}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-75"
                  onClick={nextImage}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Thumbnail Navigation */}
            {imageZoomModal.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black bg-opacity-50 p-2 rounded-lg">
                {imageZoomModal.images.map((_, index) => (
                  <button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === imageZoomModal.currentIndex ? "bg-white" : "bg-white bg-opacity-50"
                    }`}
                    onClick={() => setImageZoomModal((prev) => ({ ...prev, currentIndex: index }))}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>Update user information and settings</DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={editingUser.first_name || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={editingUser.last_name || ""}
                    onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser.email || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editingUser.mobile_number || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, mobile_number: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="about_me">About Me</Label>
                <Textarea
                  id="about_me"
                  value={editingUser.about_me || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, about_me: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="verification_status">Verification Status</Label>
                  <Select
                    value={editingUser.verification_status || "pending"}
                    onValueChange={(value) => setEditingUser({ ...editingUser, verification_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="kyc_status">KYC Status</Label>
                  <Select
                    value={editingUser.kyc_status || "Pending"}
                    onValueChange={(value) => setEditingUser({ ...editingUser, kyc_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Verified">Verified</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button onClick={() => handleEditUser(editingUser)} disabled={actionLoading === "edit"}>
                  {actionLoading === "edit" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notification Modal */}
      <Dialog
        open={notificationModal.open}
        onOpenChange={(open) => setNotificationModal({ ...notificationModal, open })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Send a notification to {notificationModal.user?.first_name} {notificationModal.user?.last_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="notification_type">Notification Type</Label>
              <Select
                value={notificationModal.type}
                onValueChange={(value) => setNotificationModal({ ...notificationModal, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profile_update">Profile Update Required</SelectItem>
                  <SelectItem value="verification_pending">Verification Under Review</SelectItem>
                  <SelectItem value="verification_rejected">Verification Update Needed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notification_message">Message</Label>
              <Textarea
                id="notification_message"
                value={notificationModal.message}
                onChange={(e) => setNotificationModal({ ...notificationModal, message: e.target.value })}
                rows={4}
                placeholder="Enter your message here..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setNotificationModal({ open: false, user: null, message: "", type: "profile_update" })}
              >
                Cancel
              </Button>
              <Button onClick={handleSendNotification}>
                <Send className="w-4 h-4 mr-2" />
                Send Notification
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Scoring Modal */}
      <Dialog open={scoringModal.open} onOpenChange={(open) => !open && setScoringModal({ open: false, user: null, score: 5, action: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">★</span>
              </div>
              Rate Profile Quality
            </DialogTitle>
            <DialogDescription>
              {scoringModal.action === 'verify' ? 'Approve and rate' : 'Reject and rate'} {scoringModal.user?.first_name} {scoringModal.user?.last_name}'s profile quality (1-10)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Profile Preview */}
            {scoringModal.user && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden">
                    {scoringModal.user.profile_photo_url ? (
                      <Image 
                        src={scoringModal.user.profile_photo_url} 
                        alt={scoringModal.user.first_name || 'Profile'} 
                        width={48} 
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white text-sm">
                        {(scoringModal.user.first_name || 'U')[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">{scoringModal.user.first_name} {scoringModal.user.last_name}</h4>
                    <p className="text-sm text-gray-600">{scoringModal.user.profession || 'No profession listed'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Score Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="profile_score" className="text-sm font-medium">Profile Quality Score</Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">{scoringModal.score}</span>
                  <span className="text-sm text-gray-500">/10</span>
                </div>
              </div>
              
              <div className="space-y-2">
                                  <input
                    type="range"
                    id="profile_score"
                    min="1"
                    max="10"
                    value={scoringModal.score}
                    onChange={(e) => setScoringModal({ ...scoringModal, score: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((scoringModal.score - 1) / 9) * 100}%, #e5e7eb ${((scoringModal.score - 1) / 9) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 - Poor</span>
                  <span>5 - Average</span>
                  <span>10 - Exceptional</span>
                </div>
              </div>

              {/* Score Guidelines */}
              <div className="bg-blue-50 rounded-lg p-3 text-xs">
                <p className="font-medium text-blue-900 mb-2">Scoring Guidelines:</p>
                <div className="space-y-1 text-blue-800">
                  <p><strong>8-10:</strong> Exceptional photos, complete profile, compelling spiritual content</p>
                  <p><strong>6-7:</strong> Good photos, adequate profile completion, some spiritual depth</p>
                  <p><strong>4-5:</strong> Basic profile, limited photos or information</p>
                  <p><strong>1-3:</strong> Poor quality, incomplete, or inappropriate content</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setScoringModal({ open: false, user: null, score: 5, action: null })}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleScoringSubmit}
                className={scoringModal.action === 'verify' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {scoringModal.action === 'verify' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve with Score {scoringModal.score}/10
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject with Score {scoringModal.score}/10
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

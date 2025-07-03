"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, 
  Star, 
  MapPin, 
  Crown, 
  Lock, 
  Zap, 
  Users, 
  ArrowRight,
  Sparkles,
  Calendar
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface LikeProfile {
  id: string
  action: 'like' | 'superlike'
  created_at: string
  profile: {
    id: string
    first_name?: string
    last_name?: string
    profile_photo_url?: string
    user_photos?: string[]
    gender?: string
    birthdate?: string
    city?: { name: string }
    state?: { name: string }
    is_premium: boolean
  }
}

interface WhoLikedYouData {
  likes: LikeProfile[]
  total_likes: number
  user_plan: string
  can_see_details: boolean
  upgrade_message?: string
}

interface WhoLikedYouProps {
  userProfile?: any
}

export default function WhoLikedYou({ userProfile }: WhoLikedYouProps) {
  const [data, setData] = useState<WhoLikedYouData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchWhoLikedMe()
  }, [])

  const fetchWhoLikedMe = async () => {
    try {
      setLoading(true)
      setError(null) // Clear previous errors
      const response = await fetch("/api/profiles/who-liked-me", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Network error" }))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch likes`)
      }

      const result = await response.json()
      setData(result)
    } catch (error: any) {
      console.error("Error fetching who liked me:", error)
      setError(error.message || "Unable to load likes. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInstantMatch = async (likedUserId: string) => {
    if (!data?.can_see_details) {
      router.push("/dashboard/store")
      return
    }

    try {
      setProcessing(likedUserId)
      
      // Use specialized instant match endpoint for premium users
      const response = await fetch("/api/swipe/instant-match", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: likedUserId,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success("🎉 It's a match! You can now message each other.")
        // Remove the liked user from the list
        setData(prev => prev ? {
          ...prev,
          likes: prev.likes.filter(like => like.id !== likedUserId),
          total_likes: prev.total_likes - 1
        } : null)
      } else {
        if (result.upgrade_required) {
          toast.error("Premium subscription required for instant matching")
          router.push("/dashboard/store")
        } else {
          toast.error(result.error || "Failed to create instant match")
        }
      }
    } catch (error: any) {
      console.error("Error creating instant match:", error)
      toast.error("Failed to create instant match")
    } finally {
      setProcessing(null)
    }
  }

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return null
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return "Today"
    } else if (diffDays === 2) {
      return "Yesterday"
    } else if (diffDays <= 7) {
      return `${diffDays - 1}d ago`
    } else {
      return `${Math.ceil(diffDays / 7)}w ago`
    }
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'samarpan':
        return { label: 'Samarpan', color: 'bg-purple-600', icon: Crown }
      case 'sangam':
        return { label: 'Sangam', color: 'bg-blue-600', icon: Star }
      case 'sparsh':
        return { label: 'Sparsh', color: 'bg-green-600', icon: Sparkles }
      default:
        return { label: 'Drishti', color: 'bg-gray-500', icon: Users }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Who Liked You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Who Liked You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">{error}</p>
            <Button 
              variant="outline" 
              onClick={fetchWhoLikedMe}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.total_likes === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Who Liked You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No likes yet</h3>
            <p className="text-gray-500">
              Your admirers will appear here when they swipe right on your profile.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const planBadge = getPlanBadge(data.user_plan)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Who Liked You
            <Badge variant="secondary" className="ml-2">
              {data.total_likes}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium text-white ${planBadge.color}`}>
              <planBadge.icon className="w-3 h-3 inline mr-1" />
              {planBadge.label}
            </div>
          </div>
        </div>
        
        {!data.can_see_details && data.upgrade_message && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 mt-3">
            <p className="text-sm text-purple-800 mb-2">{data.upgrade_message}</p>
            <Button 
              size="sm" 
              onClick={() => router.push("/dashboard/store")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {data.likes.map((like) => (
            <motion.div
              key={like.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              className="relative"
            >
              <Card className={`p-3 cursor-pointer transition-all duration-200 ${
                data.can_see_details ? 'hover:shadow-md' : ''
              }`}>
                <div className="text-center">
                  {/* Profile Image */}
                  <div className="relative mb-3">
                    <Avatar className="w-16 h-16 mx-auto">
                      <AvatarImage
                        src={
                          data.can_see_details 
                            ? (like.profile.profile_photo_url || like.profile.user_photos?.[0] || "/placeholder-user.jpg")
                            : "/placeholder-user.jpg"
                        }
                        className={!data.can_see_details ? "blur-md" : ""}
                      />
                      <AvatarFallback>
                        {data.can_see_details 
                          ? `${like.profile.first_name?.[0] || ''}${like.profile.last_name?.[0] || ''}`
                          : '?'
                        }
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Action Badge */}
                    <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${
                      like.action === 'superlike' ? 'bg-orange-500' : 'bg-red-500'
                    }`}>
                      {like.action === 'superlike' ? (
                        <Star className="w-3 h-3 text-white" fill="currentColor" />
                      ) : (
                        <Heart className="w-3 h-3 text-white" fill="currentColor" />
                      )}
                    </div>

                    {/* Blur Overlay for Basic Users */}
                    {!data.can_see_details && (
                      <div className="absolute inset-0 bg-black/10 rounded-full flex items-center justify-center">
                        <Lock className="w-6 h-6 text-white/80" />
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className="space-y-1">
                    <h4 className={`font-semibold text-sm ${!data.can_see_details ? 'blur-sm' : ''}`}>
                      {data.can_see_details 
                        ? `${like.profile.first_name || ''} ${like.profile.last_name || ''}`
                        : 'Someone'
                      }
                    </h4>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      {like.profile.gender && (
                        <p>{like.profile.gender}</p>
                      )}
                      
                      {like.profile.city?.name && like.profile.state?.name && (
                        <p className="flex items-center justify-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">
                            {like.profile.city.name}
                          </span>
                        </p>
                      )}
                      
                      <p className="flex items-center justify-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTimeAgo(like.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    size="sm"
                    onClick={() => handleInstantMatch(like.id)}
                    disabled={processing === like.id}
                    className={`w-full mt-3 ${
                      data.can_see_details
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                    }`}
                  >
                    {processing === like.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : data.can_see_details ? (
                      <>
                        <Heart className="w-3 h-3 mr-1" fill="currentColor" />
                        Like Back
                      </>
                    ) : (
                      <>
                        <Crown className="w-3 h-3 mr-1" />
                        Unlock
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Show More Button for Premium Users */}
        {data.can_see_details && data.total_likes > 8 && (
          <div className="mt-6 text-center">
            <Button 
              variant="outline"
              onClick={() => router.push("/dashboard/matches/who-liked-me")}
            >
              See All {data.total_likes} Likes
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
        
        {/* Upgrade CTA for Basic Users */}
        {!data.can_see_details && (
          <div className="mt-6 text-center">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4 mb-4">
              <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900 mb-1">See Who Likes You</h4>
              <p className="text-sm text-gray-600 mb-3">
                Upgrade to see full profiles and instantly match with people who already like you!
              </p>
              <Button 
                onClick={() => router.push("/dashboard/store")}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Sangam
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 
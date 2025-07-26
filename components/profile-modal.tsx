"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Heart,
  Home,
  Users,
  Star,
  Sparkles,
  Crown,
  Lock,
  Brain,
  Shield,
  Activity,
  Coffee,
  Leaf,
  ArrowLeft,
  X,
  Info,
  Flag,
  Quote,
  Globe,
  Languages,
  Ruler,
  MessageCircle
} from "lucide-react"
import Image from "next/image"
import { useAuthContext } from "@/components/auth-provider"
import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"

interface ProfileModalProps {
  profile: any
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ profile, isOpen, onClose }: ProfileModalProps) {
  const { profile: userProfile } = useAuthContext()
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)

  if (!profile) return null

  // Get user's subscription plan
  const getUserPlan = () => {
    if (!userProfile) return 'drishti'
    const plan = userProfile.account_status || 'drishti'
    return plan
  }

  const userPlan = getUserPlan()
  
  // AI access levels based on plan
  const aiAccess = {
    basic: ['sangam', 'samarpan'].includes(userPlan?.toLowerCase?.() || '') || 
           ['sangam', 'samarpan'].includes(userProfile?.account_status?.toLowerCase?.() || ''),
    advanced: userPlan?.toLowerCase?.() === 'samarpan' || 
              userProfile?.account_status?.toLowerCase?.() === 'samarpan'
  }

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return "N/A"
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // Handle photos from JSONB user_photos field
  const getPhotos = () => {
    const photos = []
    
    // Add profile photo first if it exists
    if (profile.profile_photo_url) {
      photos.push(profile.profile_photo_url)
    }
    
    // Handle user_photos JSONB field
    if (profile.user_photos) {
      let additionalPhotos = []
      
      // If it's already an array
      if (Array.isArray(profile.user_photos)) {
        additionalPhotos = profile.user_photos
      } 
      // If it's a JSONB string, parse it
      else if (typeof profile.user_photos === 'string') {
        try {
          additionalPhotos = JSON.parse(profile.user_photos)
        } catch (e) {
          console.warn('Failed to parse user_photos:', e)
          additionalPhotos = []
        }
      }
      // If it's already a parsed object with array structure
      else if (typeof profile.user_photos === 'object' && profile.user_photos !== null) {
        additionalPhotos = Array.isArray(profile.user_photos) ? profile.user_photos : []
      }
      
      // Filter out profile photo to avoid duplicates and add the rest
      if (Array.isArray(additionalPhotos)) {
        const uniquePhotos = additionalPhotos.filter((photo: string) => photo !== profile.profile_photo_url)
        photos.push(...uniquePhotos)
      }
    }
    
    // Fallback to placeholder if no photos
    if (photos.length === 0) {
      photos.push("/placeholder-user.jpg")
    }
    
    return photos
  }

  const photos = getPhotos()
  const age = calculateAge(profile.birthdate)

  // Format height display
  const formatHeight = () => {
    if (profile.height_ft && profile.height_in !== undefined) {
      return `${profile.height_ft}' ${profile.height_in}"`
    }
    return null
  }

  // Handle spiritual organizations - check both array and backup string
  const getSpiritualOrgs = () => {
    if (profile.spiritual_org && Array.isArray(profile.spiritual_org) && profile.spiritual_org.length > 0) {
      return profile.spiritual_org
    }
    if (profile.spiritual_org_backup) {
      return [profile.spiritual_org_backup]
    }
    return []
  }

  // Handle daily practices - check both array and backup string
  const getDailyPractices = () => {
    if (profile.daily_practices && Array.isArray(profile.daily_practices) && profile.daily_practices.length > 0) {
      return profile.daily_practices
    }
    if (profile.daily_practices_backup) {
      return [profile.daily_practices_backup]
    }
    return []
  }

  // Get location string
  const getLocationString = () => {
    if (profile.city?.name && profile.state?.name) {
      return `${profile.city.name}, ${profile.state.name}`
    }
    return null
  }

  // Handle report user functionality
  const handleReport = async () => {
    if (!profile?.id) return
    
    setReportLoading(true)
    try {
      console.log('[ProfileModal] Reporting user:', profile.id)
      const requestBody = {
        reported_user_id: profile.id,
        reason: 'Inappropriate content - reported from profile view'
      }
      console.log('[ProfileModal] Request body:', requestBody)
      
      const response = await fetch('/api/messages/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()
      console.log('[ProfileModal] Report API response:', { status: response.status, result })

      if (response.ok) {
        toast.success(`${profile.first_name} has been reported successfully`)
        setShowReportDialog(false)
      } else {
        const errorMessage = result?.message || result?.error || "Failed to report user"
        console.error('[ProfileModal] Report failed:', errorMessage)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('[ProfileModal] Report error:', error)
      toast.error(`Failed to report user: ${error instanceof Error ? error.message : 'Network error'}`)
    } finally {
      setReportLoading(false)
    }
  }

  // Reset photo index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPhotoIndex(0)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg h-[95vh] p-0 gap-0 bg-white">
        <div className="sr-only">
          <DialogTitle>
            {profile.first_name} {profile.last_name}'s Profile
          </DialogTitle>
        </div>
        
        {/* Fixed Header */}
                  <div className="relative flex items-center justify-between px-4 pt-8 pb-4 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-10">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="text-center">
            <h2 className="font-semibold text-gray-900">
              {profile.first_name}
            </h2>
            <p className="text-xs text-gray-500">
              {age !== "N/A" ? `${age} years old` : ''}
            </p>
          </div>
          
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          
          {/* Profile Header with Basic Info */}
          <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-purple-900 via-violet-700 to-pink-600 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-3 border-white/20">
                <Image
                  src={photos[0] || "/placeholder-user.jpg"}
                  alt={`${profile.first_name}'s avatar`}
                  fill
                  className="object-cover"
                />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">
                    {profile.first_name}
                  </h1>
                  <span className="text-xl text-white/90">
                    {age !== "N/A" ? age : ""}
                  </span>
                  {profile.verification_status === 'verified' && (
                    <div className="bg-white/20 rounded-full p-1.5">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                
                {getLocationString() && (
                  <div className="flex items-center gap-2 text-white/90">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{getLocationString()}</span>
                  </div>
                )}
              </div>
            </div>
            
            {getSpiritualOrgs().length > 0 && (
              <div className="flex flex-wrap gap-2">
                {getSpiritualOrgs().slice(0, 3).map((org: string, idx: number) => (
                  <Badge key={idx} className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs">
                    {org}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Photo Gallery Navigation */}
          {photos.length > 0 && (
            <div className="px-6 py-6 bg-white border-b border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-[#8b0000]" />
                <h3 className="text-lg font-semibold text-gray-900">Photos</h3>
                <span className="text-sm text-gray-500">({photos.length})</span>
              </div>
              
              {/* Current Photo Display */}
              <div className="relative h-80 bg-gray-100 rounded-xl overflow-hidden mb-4">
                <Image
                  src={photos[currentPhotoIndex] || "/placeholder-user.jpg"}
                  alt={`${profile.first_name}'s photo ${currentPhotoIndex + 1}`}
                  fill
                  className="object-cover"
                />
                
                {/* Navigation arrows */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentPhotoIndex(currentPhotoIndex > 0 ? currentPhotoIndex - 1 : photos.length - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setCurrentPhotoIndex(currentPhotoIndex < photos.length - 1 ? currentPhotoIndex + 1 : 0)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      →
                    </button>
                    
                    {/* Photo indicator */}
                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-white text-sm font-medium">
                        {currentPhotoIndex + 1} / {photos.length}
                      </span>
                    </div>
                  </>
                )}
              </div>
              
              {/* Photo Thumbnails */}
              {photos.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                        index === currentPhotoIndex 
                          ? 'border-[#8b0000] ring-2 ring-[#8b0000]/20' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Image
                        src={photo}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content Sections */}
          <div className="px-6 pb-6 space-y-6 bg-white">
            
            {/* About Section */}
            {profile.about_me && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Info className="h-5 w-5 text-[#8b0000]" />
                  <h3 className="text-lg font-semibold text-gray-900">About {profile.first_name}</h3>
                </div>
                <p className="text-gray-700 leading-relaxed text-base">
                  {profile.about_me}
                </p>
              </div>
            )}

            {/* Essential Details */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-[#8b0000]" />
                <h3 className="text-lg font-semibold text-gray-900">Essential Details</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Users, label: "Gender", value: profile.gender },
                  { icon: GraduationCap, label: "Education", value: profile.education },
                  { icon: Briefcase, label: "Profession", value: profile.profession },
                  { icon: Ruler, label: "Height", value: formatHeight() },
                  { icon: Heart, label: "Marital Status", value: profile.marital_status },
                  { icon: Leaf, label: "Diet", value: profile.diet },
                  { icon: Home, label: "Temple Visits", value: profile.temple_visit_freq },
                  { icon: Briefcase, label: "Annual Income", value: profile.annual_income },
                  { icon: Languages, label: "Mother Tongue", value: profile.mother_tongue },
                ].filter(item => item.value && item.value !== "N/A").map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <item.icon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <p className="font-medium text-gray-900">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spiritual Journey */}
            {(getSpiritualOrgs().length > 0 || getDailyPractices().length > 0 || profile.artha_vs_moksha || profile.vanaprastha_interest) && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-[#8b0000]" />
                  <h3 className="text-lg font-semibold text-gray-900">Spiritual Journey</h3>
                </div>
                
                <div className="space-y-4">
                  {getSpiritualOrgs().length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Spiritual Organizations</p>
                      <div className="flex flex-wrap gap-2">
                        {getSpiritualOrgs().map((org: string, index: number) => (
                          <Badge key={index} variant="outline" className="border-[#8b0000] text-[#8b0000]">
                            {org}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {getDailyPractices().length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Daily Practices</p>
                      <div className="flex flex-wrap gap-2">
                        {getDailyPractices().map((practice: string, index: number) => (
                          <Badge key={index} variant="outline" className="border-purple-500 text-purple-700">
                            {practice}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.artha_vs_moksha && (
                    <div className="bg-purple-50 rounded-xl p-4">
                      <p className="text-sm text-purple-600 mb-1">Life Balance (Artha vs Moksha)</p>
                      <p className="font-semibold text-purple-900">
                        {typeof profile.artha_vs_moksha === 'number' || !isNaN(Number(profile.artha_vs_moksha)) 
                          ? `${profile.artha_vs_moksha}/10` 
                          : profile.artha_vs_moksha}
                      </p>
                    </div>
                  )}

                  {profile.vanaprastha_interest && (
                    <div className="bg-orange-50 rounded-xl p-4">
                      <p className="text-sm text-orange-600 mb-1">Vanaprastha Interest</p>
                      <p className="font-semibold text-orange-900">{profile.vanaprastha_interest}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Looking For */}
            {profile.ideal_partner_notes && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="h-5 w-5 text-[#8b0000]" />
                  <h3 className="text-lg font-semibold text-gray-900">Looking For</h3>
                </div>
                <div className="bg-rose-50 rounded-xl p-4">
                  <p className="text-gray-700 leading-relaxed">
                    {profile.ideal_partner_notes}
                  </p>
                </div>
              </div>
            )}

            {/* Favorite Quote */}
            {profile.favorite_spiritual_quote && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Quote className="h-5 w-5 text-[#8b0000]" />
                  <h3 className="text-lg font-semibold text-gray-900">Spiritual Quote</h3>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
                  <blockquote className="text-gray-700 italic text-center leading-relaxed">
                    "{profile.favorite_spiritual_quote}"
                  </blockquote>
                </div>
              </div>
            )}

            {/* AI Compatibility Analysis */}
            {(aiAccess.basic || (profile.compatibility && profile.compatibility.total)) && (
              <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-2xl p-6 border border-purple-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-600" />
                    <h3 className="text-xl font-bold text-gray-900">AI Matching Analysis</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {aiAccess.basic ? (
                      profile.compatibility && profile.compatibility.total ? (
                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                          profile.compatibility.total >= 90 ? 'bg-green-100 text-green-800' :
                          profile.compatibility.total >= 75 ? 'bg-blue-100 text-blue-800' :
                          profile.compatibility.total >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {Math.round(Number(profile.compatibility?.total) || 0)}% Match
                        </div>
                      ) : (
                        <div className="px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-bold">
                          Analyzing...
                        </div>
                      )
                    ) : (
                      <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Locked
                      </div>
                    )}
                  </div>
                </div>

                {aiAccess.basic ? (
                  profile.compatibility && profile.compatibility.total ? (
                    <div className="space-y-6">
                      {/* Compatibility Breakdown */}
                      {profile.compatibility.breakdown && Object.keys(profile.compatibility.breakdown).length > 0 && (
                        <div className="grid grid-cols-1 gap-3">
                          {Object.entries(profile.compatibility.breakdown || {}).map(([category, score]) => {
                            const categoryIcons: Record<string, any> = {
                              spiritual: '🕉️',
                              lifestyle: '🌱',
                              psychological: '🧠',
                              demographic: '📍',
                              preference: '💝',
                              semantic: '🔮',
                              growth_potential: '📈'
                            }
                            const categoryLabels: Record<string, string> = {
                              spiritual: 'Spiritual',
                              lifestyle: 'Lifestyle',
                              psychological: 'Mindset',
                              demographic: 'Demographics',
                              preference: 'Preferences',
                              semantic: 'Deep Values',
                              growth_potential: 'Growth'
                            }
                            
                            return (
                              <div key={category} className="bg-white/70 rounded-xl p-4 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <span className="text-lg">{categoryIcons[category] || '✨'}</span>
                                    {categoryLabels[category] || category}
                                  </span>
                                  <span className="text-sm font-bold text-purple-700">
                                    {Math.round(Number(score) || 0)}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                                    style={{ width: `${Math.round(Number(score) || 0)}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Key Reasons */}
                      {profile.compatibility.reasons && profile.compatibility.reasons.length > 0 && (
                        <div>
                          <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            💫 Why This Match Works
                          </h5>
                          <div className="space-y-2">
                            {profile.compatibility.reasons.slice(0, 3).map((reason: string, index: number) => {
                              if (!reason || typeof reason !== 'string' || reason.trim() === '') return null
                              return (
                                <div key={index} className="bg-white/70 rounded-lg p-3">
                                  <p className="text-sm text-gray-700">{reason.trim()}</p>
                                </div>
                              )
                            }).filter(Boolean)}
                          </div>
                        </div>
                      )}

                      {/* Unique Strengths */}
                      {profile.compatibility.unique_strengths && profile.compatibility.unique_strengths.length > 0 && (
                        <div>
                          <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            💎 Match Strengths
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {profile.compatibility.unique_strengths.slice(0, 4).map((strength: string, index: number) => {
                              if (!strength || typeof strength !== 'string' || strength.trim() === '') return null
                              return (
                                <span 
                                  key={index} 
                                  className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-sm font-medium border border-purple-200"
                                >
                                  {strength.trim()}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* AI Disclaimer */}
                      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-xs text-amber-700 text-center leading-relaxed">
                          🤖 <strong>AI Wisdom Disclaimer:</strong> Our AI is quite clever, but it's still learning about matters of the heart! 
                          While it crunches compatibility data like a digital pandit, remember that love is beautifully unpredictable. 
                          Trust your intuition, follow your heart, and let the universe guide you too! ✨
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* User has access but no compatibility data */
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Brain className="w-8 h-8 text-purple-600" />
                      </div>
                      <h5 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis in Progress</h5>
                      <p className="text-gray-600 text-sm max-w-sm mx-auto">
                        We're analyzing compatibility with {profile.first_name}. Check back soon for detailed insights!
                      </p>
                    </div>
                  )
                ) : (
                  /* Locked AI Analysis */
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      Unlock AI Matching Insights
                    </h4>
                    <p className="text-gray-600 text-sm mb-4 max-w-sm mx-auto">
                      Get personalized compatibility analysis and relationship insights powered by AI.
                    </p>
                    <Button
                      onClick={() => window.location.href = '/dashboard/store'}
                      className="bg-gradient-to-r from-[#8b0000] to-red-700 hover:from-red-800 hover:to-red-900 text-white font-semibold px-6 py-2 rounded-full shadow-lg flex items-center gap-2 mx-auto"
                    >
                      <Crown className="w-4 h-4" />
                      Upgrade to Sangam
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Report User Section - Only show if not viewing own profile */}
            {userProfile?.id !== profile?.id && (
              <div className="px-6 py-4 border-t border-gray-100">
                <Button
                  onClick={() => setShowReportDialog(true)}
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700 py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  Report User
                </Button>
              </div>
            )}

            {/* Bottom spacing for safe area */}
            <div className="h-8"></div>
          </div>
        </div>
      </DialogContent>

      {/* Report Dialog */}
      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to report {profile?.first_name}? This will notify our moderation team for review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reportLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReport} 
              disabled={reportLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {reportLoading ? "Reporting..." : "Report User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
} 
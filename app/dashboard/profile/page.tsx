"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Edit,
  Camera,
  MapPin,
  Briefcase,
  Heart,
  Eye,
  Users,
  Activity,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Ruler,
  Calendar,
} from "lucide-react"
import MobileNav from "@/components/dashboard/mobile-nav"
import ProfileImageUploader from "@/components/dashboard/profile-image-uploader"
import { Badge } from "@/components/ui/badge"

export default function ProfilePage() {
  // Get auth state from context (already fetched once globally)
  const { user, profile: rawProfile, loading } = useAuthContext()
  // The joined profile includes nested city/state objects not declared in UserProfile type.
  const profile: any = rawProfile
  const router = useRouter()
  // Redirect unauthenticated user safely after render
  useEffect(() => {
    if (!loading && !profile) {
      router.replace("/")
    }
  }, [loading, profile, router])
  const [userImages, setUserImages] = useState<string[]>(profile?.user_photos ?? [])
  const [showPreview, setShowPreview] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Update images when profile is loaded/refreshed
  useEffect(() => {
    if (profile?.user_photos) {
      setUserImages(profile.user_photos)
    }
  }, [profile])

  useEffect(() => {
    if (showPreview) {
      setCurrentImageIndex(0)
    }
  }, [showPreview])

  // Show loader while auth loading or immediately after scheduling redirect
  if (loading || !profile) {
    return <>{require("./loading").default()}</>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <MobileNav userProfile={profile} />

      {/* Main Content with proper spacing to avoid overlap */}
      <main className="pt-20 pb-40 px-4 min-h-screen">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
                <p className="text-sm text-gray-600">View and manage your profile</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowPreview(true)}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={() => router.push("/dashboard/settings")}
                className="bg-gradient-to-r from-orange-500 to-pink-500"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    {userImages.length > 0 ? (
                      <img
                        src={userImages[0] || "/placeholder.svg"}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-orange-200"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {profile?.first_name?.[0]}
                        {profile?.last_name?.[0]}
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {profile?.first_name} {profile?.last_name}
                  </h2>
                  <p className="text-gray-600 mb-2">
                    {calculateAge(profile?.birthdate)} years • {profile?.gender}
                  </p>
                  {profile?.city?.name && profile?.state?.name && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.city.name}, {profile.state.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Photo Management */}
            <Card data-photo-section>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Profile Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileImageUploader
                  userId={user?.id || ""}
                  currentImages={userImages}
                  onImagesUpdate={setUserImages}
                />
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium">
                      {profile?.birthdate ? new Date(profile.birthdate).toLocaleDateString() : "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Height</p>
                    <p className="font-medium">
                      {profile?.height_ft && profile?.height_in 
                        ? `${profile.height_ft}' ${profile.height_in}"` 
                        : "Not specified"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mother Tongue</p>
                  <p className="font-medium">{profile?.mother_tongue || "Not specified"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Education</p>
                  <p className="font-medium">{profile?.education || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profession</p>
                  <p className="font-medium">{profile?.profession || "Not specified"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Spiritual Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Spiritual Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Diet</p>
                  <p className="font-medium">{profile?.diet || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Temple Visit Frequency</p>
                  <p className="font-medium">{profile?.temple_visit_freq || "Not specified"}</p>
                </div>
                {profile?.spiritual_org && Array.isArray(profile.spiritual_org) && profile.spiritual_org.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Spiritual Organizations</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.spiritual_org.map((org: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {org}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Practices */}
            {profile?.daily_practices && Array.isArray(profile.daily_practices) && profile.daily_practices.length > 0 && (
              <div>
                <p className="text-sm text-gray-500">Daily Practices</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {profile.daily_practices.map((practice: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {practice}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* About Me */}
            {profile?.about_me && (
              <Card>
                <CardHeader>
                  <CardTitle>About Me</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{profile.about_me}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Family & Background */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Family & Background
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Marital Status</p>
                  <p className="font-medium">{profile?.marital_status || "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Spiritual Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Detailed Spiritual Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Vanaprastha Interest</p>
                  <p className="font-medium">{profile?.vanaprastha_interest || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Life Philosophy</p>
                  <p className="font-medium">{profile?.artha_vs_moksha || "Not specified"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partner Preferences */}
          {profile?.ideal_partner_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  Partner Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">Partner Expectations</h3>
                  <p className="text-gray-700 leading-relaxed">{profile.ideal_partner_notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Profile Preview Modal */}
          {showPreview && (
            <div className="fixed inset-0 bg-black/50 z-[100000]" onClick={() => setShowPreview(false)}>
              <div className="w-full h-screen bg-white overflow-y-auto relative max-w-full" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button
                  onClick={() => setShowPreview(false)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/20 rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors z-30"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="pb-32">
                  {/* Photo Gallery */}
                  {userImages && userImages.length > 0 && (
                    <div className="relative h-[50vh] bg-gray-100 overflow-hidden">
                      <div className="flex h-full">
                        <div className="w-full h-full relative">
                          <img
                            src={userImages[currentImageIndex] || "/placeholder.svg"}
                            alt={`${profile?.first_name} ${profile?.last_name}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Navigation Arrows */}
                          {userImages.length > 1 && (
                            <>
                              <button
                                onClick={() =>
                                  setCurrentImageIndex((prev) => (prev === 0 ? userImages.length - 1 : prev - 1))
                                }
                                className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-20"
                              >
                                <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
                              </button>
                              <button
                                onClick={() =>
                                  setCurrentImageIndex((prev) => (prev === userImages.length - 1 ? 0 : prev + 1))
                                }
                                className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors z-20"
                              >
                                <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Photo Navigation Dots */}
                      {userImages.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 sm:gap-3 z-20">
                          {userImages.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentImageIndex(idx)}
                              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                                idx === currentImageIndex ? "bg-white scale-125" : "bg-white/60 hover:bg-white/80"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4 sm:p-6">
                    {/* Profile Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden">
                          <img
                            src={userImages[0] || "/placeholder.svg"}
                            alt={`${profile?.first_name} ${profile?.last_name}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                            {profile?.first_name} {profile?.last_name}
                          </h3>
                          <p className="text-gray-600">{calculateAge(profile?.birthdate)} years old</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          setShowPreview(false)
                          router.push("/dashboard/settings")
                        }}
                        className="bg-gradient-to-r from-orange-500 to-pink-500 w-full sm:w-auto"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>

                    {/* About Section */}
                    {profile?.about_me && (
                      <div className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl border border-orange-100">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Heart className="w-5 h-5 text-orange-500" />
                          About Me
                        </h4>
                        <p className="text-gray-700 leading-relaxed">{profile.about_me}</p>
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                      {profile?.city?.name && profile?.state?.name && (
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                          <MapPin className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="font-medium">
                              {profile.city.name}, {profile.state.name}
                            </p>
                          </div>
                        </div>
                      )}

                      {profile?.profession && (
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                          <Briefcase className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500">Profession</p>
                            <p className="font-medium">{profile.profession}</p>
                          </div>
                        </div>
                      )}

                      {profile?.education && (
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                          <div className="w-5 h-5 text-gray-500">🎓</div>
                          <div>
                            <p className="text-sm text-gray-500">Education</p>
                            <p className="font-medium">{profile.education}</p>
                          </div>
                        </div>
                      )}

                      {profile?.diet && (
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                          <Sparkles className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500">Diet</p>
                            <p className="font-medium">{profile.diet}</p>
                          </div>
                        </div>
                      )}

                      {profile?.height_ft && profile?.height_in && (
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                          <Ruler className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500">Height</p>
                            <p className="font-medium">{profile.height_ft}' {profile.height_in}"</p>
                          </div>
                        </div>
                      )}

                      {profile?.birthdate && (
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm text-gray-500">Birth Date</p>
                            <p className="font-medium">{new Date(profile.birthdate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Personal Information */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Personal Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {profile?.height_ft && profile?.height_in && (
                          <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                            <Ruler className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Height</p>
                              <p className="font-medium">{profile.height_ft}' {profile.height_in}"</p>
                            </div>
                          </div>
                        )}

                        {profile?.birthdate && (
                          <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Birth Date</p>
                              <p className="font-medium">{new Date(profile.birthdate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        )}

                        {profile?.marital_status && (
                          <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                            <Users className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">Marital Status</p>
                              <p className="font-medium">{profile.marital_status}</p>
                            </div>
                          </div>
                        )}

                        {profile?.mother_tongue && (
                          <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                            <div className="w-5 h-5 text-gray-500">🗣️</div>
                            <div>
                              <p className="text-sm text-gray-500">Mother Tongue</p>
                              <p className="font-medium">{profile.mother_tongue}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Professional Information */}
                    {(profile?.education || profile?.profession || profile?.annual_income) && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Briefcase className="w-5 h-5" />
                          Professional Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {profile?.education && (
                            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                              <div className="w-5 h-5 text-gray-500">🎓</div>
                              <div>
                                <p className="text-sm text-gray-500">Education</p>
                                <p className="font-medium">{profile.education}</p>
                              </div>
                            </div>
                          )}

                          {profile?.profession && (
                            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                              <Briefcase className="w-5 h-5 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-500">Profession</p>
                                <p className="font-medium">{profile.profession}</p>
                              </div>
                            </div>
                          )}

                          {profile?.annual_income && (
                            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                              <div className="w-5 h-5 text-gray-500">💰</div>
                              <div>
                                <p className="text-sm text-gray-500">Annual Income</p>
                                <p className="font-medium">{profile.annual_income}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Spiritual Profile */}
                    {(profile?.diet || profile?.temple_visit_freq || profile?.vanaprastha_interest || profile?.artha_vs_moksha || profile?.favorite_spiritual_quote) && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Heart className="w-5 h-5" />
                          Spiritual Profile
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                          {profile?.diet && (
                            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                              <Sparkles className="w-5 h-5 text-gray-500" />
                              <div>
                                <p className="text-sm text-gray-500">Diet</p>
                                <p className="font-medium">{profile.diet}</p>
                              </div>
                            </div>
                          )}

                          {profile?.temple_visit_freq && (
                            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                              <div className="w-5 h-5 text-gray-500">🕉️</div>
                              <div>
                                <p className="text-sm text-gray-500">Temple Visits</p>
                                <p className="font-medium">{profile.temple_visit_freq}</p>
                              </div>
                            </div>
                          )}

                          {profile?.vanaprastha_interest && (
                            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                              <div className="w-5 h-5 text-gray-500">🧘</div>
                              <div>
                                <p className="text-sm text-gray-500">Vanaprastha Interest</p>
                                <p className="font-medium">{profile.vanaprastha_interest}</p>
                              </div>
                            </div>
                          )}

                          {profile?.artha_vs_moksha && (
                            <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
                              <div className="w-5 h-5 text-gray-500">⚖️</div>
                              <div>
                                <p className="text-sm text-gray-500">Life Philosophy</p>
                                <p className="font-medium">{profile.artha_vs_moksha}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {profile?.favorite_spiritual_quote && (
                          <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                            <p className="text-sm text-gray-500 mb-2">Favorite Spiritual Quote</p>
                            <p className="text-gray-700 italic">"{profile.favorite_spiritual_quote}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Daily Practices */}
                    {profile?.daily_practices && Array.isArray(profile.daily_practices) && profile.daily_practices.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Daily Practices</h4>
                        <div className="flex flex-wrap gap-2">
                          {Array.isArray(profile.daily_practices) && profile.daily_practices.map((practice: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm border border-orange-200">
                              {practice}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Spiritual Organizations */}
                    {profile?.spiritual_org && Array.isArray(profile.spiritual_org) && profile.spiritual_org.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Spiritual Organizations</h4>
                        <div className="flex flex-wrap gap-2">
                          {profile.spiritual_org.map((org: string, index: number) => (
                            <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm border border-purple-200">
                              {org}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Partner Preferences */}
                    {profile?.ideal_partner_notes && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Heart className="w-5 h-5" />
                          Looking For
                        </h4>
                        <div className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-100">
                          <p className="text-gray-700">{profile.ideal_partner_notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Photo Management Section */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Photos
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                        {userImages.map((image: string, index: number) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                            <img
                              src={image}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button 
                              onClick={() => {
                                setShowPreview(false)
                                // Scroll to photo management section
                                const photoSection = document.querySelector('[data-photo-section]')
                                if (photoSection) {
                                  photoSection.scrollIntoView({ behavior: 'smooth' })
                                }
                              }}
                              className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            setShowPreview(false)
                            // Scroll to photo management section
                            const photoSection = document.querySelector('[data-photo-section]')
                            if (photoSection) {
                              photoSection.scrollIntoView({ behavior: 'smooth' })
                            }
                          }}
                          className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                        >
                          <Camera className="w-6 h-6 sm:w-8 sm:h-8 mb-2" />
                          <span className="text-xs sm:text-sm">Add Photo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

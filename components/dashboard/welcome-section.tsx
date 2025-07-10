"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit, MapPin, Briefcase, Heart, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"

interface WelcomeSectionProps {
  profile: any
}

export default function WelcomeSection({ profile }: WelcomeSectionProps) {
  const router = useRouter()

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

  const getMainProfileImage = () => {
    if (profile?.user_photos && profile.user_photos.length > 0) {
      const url = profile.user_photos[0];
      // If already a full URL, use as is; otherwise, construct public bucket URL
      return url.startsWith('http') ? url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/user-photos/${url}`;
    }
    return null;
  };

  return (
    <Card className="bg-gradient-to-r from-orange-50 to-pink-50 border-orange-200 shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            {getMainProfileImage() ? (
              <img
                src={getMainProfileImage() || "/placeholder.svg"}
                alt="Profile"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg"
                style={{ objectPosition: '50% 20%' }}
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold border-4 border-white shadow-lg">
                {profile?.first_name?.[0]}
                {profile?.last_name?.[0]}
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {profile?.first_name} {profile?.last_name}
              </h2>
              <Button
                size="sm"
                onClick={() => router.push("/dashboard/profile")}
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 w-fit mx-auto sm:mx-0"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>

            {/* Basic Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 text-gray-600 justify-center sm:justify-start">
                <Calendar className="w-4 h-4" />
                <span>{calculateAge(profile?.birthdate)} years old</span>
              </div>
              {profile?.city?.name && profile?.state?.name && (
                <div className="flex items-center gap-1 text-gray-600 text-sm">
                  <MapPin className="w-3 h-3" />
                  {profile.city.name}, {profile.state.name}
                </div>
              )}
              {profile?.profession && (
                <div className="flex items-center gap-2 text-gray-600 justify-center sm:justify-start">
                  <Briefcase className="w-4 h-4" />
                  <span>{profile.profession}</span>
                </div>
              )}
              {profile?.diet && (
                <div className="flex items-center gap-2 text-gray-600 justify-center sm:justify-start">
                  <Heart className="w-4 h-4" />
                  <span>{profile.diet}</span>
                </div>
              )}
            </div>

            {/* About Me */}
            {profile?.about_me && (
              <div className="bg-white/70 rounded-lg p-4">
                <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{profile.about_me}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

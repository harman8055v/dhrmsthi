import Image from "next/image"
import { Calendar, MapPin, MessageCircle, User } from "lucide-react"
import PrimaryButton from "@/components/ui/PrimaryButton"
import VerifiedBadge from "@/components/ui/VerifiedBadge"

export interface Match {
  id: string
  name: string
  age: number
  gender?: string
  city: string
  verified?: boolean
  photoUrl: string
  matchedAt: string
  onMessage?: () => void
  onViewProfile?: () => void
}

export default function MatchCard({
  name,
  age,
  gender,
  city,
  verified,
  photoUrl,
  matchedAt,
  onMessage,
  onViewProfile,
}: Match) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow">
      <div className="relative h-16 w-16 flex-shrink-0">
        <Image src={photoUrl} alt={name} fill className="object-cover rounded-full" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">
            {name}, {age}
          </h3>
          {verified && <VerifiedBadge />}
        </div>
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> {city}
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
          <Calendar className="w-3 h-3" /> Matched {matchedAt}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <PrimaryButton size="sm" onClick={onMessage}>
          <MessageCircle className="w-4 h-4 mr-1" /> Message
        </PrimaryButton>
        <PrimaryButton variant="outline" size="sm" onClick={onViewProfile}>
          <User className="w-4 h-4 mr-1" /> View
        </PrimaryButton>
      </div>
    </div>
  )
} 
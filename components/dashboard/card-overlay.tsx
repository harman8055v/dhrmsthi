"use client"

import React from "react"
import { Calendar, MapPin, Briefcase } from "lucide-react"

interface CardOverlayProps {
  profile: any
  calculateAge: (birthdate: string) => number | string
}

const CardOverlay = React.memo<CardOverlayProps>(({ profile, calculateAge }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
      <div className="flex items-end justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">
            {profile.first_name} {profile.last_name}
          </h2>

          <div className="space-y-1 mb-3">
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Calendar className="w-4 h-4" />
              <span>{calculateAge(profile.birthdate)} years old</span>
            </div>

            {profile.city?.name && profile.state?.name && (
              <div className="flex items-center gap-1 text-white/90 text-sm">
                <MapPin className="w-3 h-3" />
                {profile.city.name}, {profile.state.name}
              </div>
            )}

            {profile.profession && (
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <Briefcase className="w-4 h-4" />
                <span>{profile.profession}</span>
              </div>
            )}
          </div>

          {/* Quick Info Tags */}
          <div className="flex flex-wrap gap-2">
            {profile.spiritual_org &&
              Array.isArray(profile.spiritual_org) &&
              profile.spiritual_org.length > 0 &&
              profile.spiritual_org.slice(0, 2).map((org: string, index: number) => (
                <span key={index} className="px-2 py-1 bg-white/20 rounded-full text-xs backdrop-blur-sm">
                  {org}
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
})

CardOverlay.displayName = "CardOverlay"

export default CardOverlay 
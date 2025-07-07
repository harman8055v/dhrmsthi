"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, Star, X, MapPin, Briefcase } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import VerifiedBadge from "@/components/ui/VerifiedBadge"

export interface SwipeProfile {
  id: string
  name: string
  age: number
  city: string
  photoUrls: string[]
  profession?: string
  verified?: boolean
}

interface SwipeCardProps {
  profile: SwipeProfile
  onSwipe: (dir: "left" | "right" | "superlike") => void
}

export default function SwipeCard({ profile, onSwipe }: SwipeCardProps) {
  const [imgIdx, setImgIdx] = useState(0)

  const nextImg = () => setImgIdx((i) => (i + 1) % profile.photoUrls.length)
  const prevImg = () => setImgIdx((i) => (i - 1 + profile.photoUrls.length) % profile.photoUrls.length)

  return (
    <motion.div
      className="relative w-full aspect-[3/4] bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-200"
      initial={{ scale: 0.95, y: 30, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
    >
      {/* photo */}
      <Image
        src={profile.photoUrls[imgIdx]}
        alt={profile.name}
        fill
        className="object-cover"
        priority
      />
      {/* gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* info */}
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-xl font-bold">
            {profile.name}, {profile.age}
          </h2>
          {profile.verified && <VerifiedBadge />}
        </div>
        <div className="flex items-center gap-2 text-sm opacity-90">
          <MapPin className="w-4 h-4" /> {profile.city}
          {profile.profession && (
            <>
              <span className="mx-1">•</span>
              <Briefcase className="w-4 h-4" /> {profile.profession}
            </>
          )}
        </div>
        {/* dots */}
        {profile.photoUrls.length > 1 && (
          <div className="flex gap-1 mt-3">
            {profile.photoUrls.map((_, i) => (
              <span
                key={i}
                className={`h-1 w-6 rounded-full ${i === imgIdx ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* nav buttons */}
      {profile.photoUrls.length > 1 && (
        <>
          <button onClick={prevImg} className="absolute h-full left-0 w-1/3" />
          <button onClick={nextImg} className="absolute h-full right-0 w-1/3" />
        </>
      )}

      {/* action buttons placeholder (outside card) */}
    </motion.div>
  )
} 
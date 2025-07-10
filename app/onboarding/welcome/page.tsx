"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { Caveat } from "next/font/google"

const caveat = Caveat({ subsets: ["latin"], weight: ["400", "700"] })

export default function OnboardingWelcome() {
  const router = useRouter()
  const [firstName, setFirstName] = useState<string>("")

  useEffect(() => {
    async function fetchName() {
      let name = ""
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        name = user.user_metadata?.first_name || ""
      }
      if (!name && typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("signupData")
          if (raw) {
            const signup = JSON.parse(raw)
            name = signup.first_name || signup.full_name?.split(" ")[0] || ""
          }
        } catch {}
      }
      setFirstName(name)
    }
    fetchName()
    const timeout = setTimeout(() => {
      router.replace("/dashboard")
    }, 5000)
    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Background */}
      <Image
        src="/welcome-bg.jpg"
        alt="Welcome background"
        fill
        className="object-cover object-top absolute inset-0 w-full h-full z-0"
        priority
      />

      {/* Divine Energy Glow Behind Box */}
      <div className="absolute z-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] max-w-[90vw] max-h-[60vh] pointer-events-none">
        <div className="w-full h-full rounded-3xl bg-gradient-to-br from-primary/30 via-pink-300/20 to-amber-200/30 blur-2xl opacity-80"></div>
      </div>

      {/* Content Box with animated border and overlays, refactored for animation visibility */}
      <div className="z-40 w-full max-w-xs sm:max-w-sm px-6 py-8 rounded-2xl flex flex-col items-center justify-center relative overflow-visible mt-24 md:mt-32" style={{minHeight:'260px'}}>
        {/* Box background */}
        <div className="absolute inset-0 rounded-2xl bg-white/80 backdrop-blur-xl shadow-2xl border-2 border-primary/20 z-0" />
        {/* Loader */}
        <div className="mb-6 relative z-30">
          <span className="block w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
        </div>
        {/* Quote */}
        <div className="text-center text-lg md:text-xl font-semibold mb-2 italic leading-snug drop-shadow-sm relative z-30">
          <span className="block text-xs md:text-sm font-bold mb-1 tracking-widest uppercase text-primary">Shiva Says</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-600 to-amber-600">“Love should always be a liberating process, not an entangling one.”</span>
        </div>
        {/* Welcome */}
        <div
          className={`text-center text-xl md:text-2xl font-semibold tracking-wide mt-4 text-brand-700 relative z-30 ${caveat.className}`}
          style={{color: 'hsl(var(--primary))', fontWeight: 700, letterSpacing: '0.01em'}}
        >
          Have a blessed journey ahead{firstName ? `, ${firstName}` : ""}.
        </div>
      </div>
    </div>
  )
} 
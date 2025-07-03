"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import AuthLoadingScreen from "@/components/auth-loading-screen"

function AuthLoadingContent() {
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")
  const isNewUser = searchParams.get("isNew") === "true"

  return <AuthLoadingScreen userId={userId || undefined} isNewUser={isNewUser} />
}

export default function AuthLoadingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-pink-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      }
    >
      <AuthLoadingContent />
    </Suspense>
  )
}

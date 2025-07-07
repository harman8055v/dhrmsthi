"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import PurchaseSuccessModal from "@/components/purchase-success-modal"

function PurchaseSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get payment details from URL params
    const sessionId = searchParams?.get("session_id")
    const paymentIntentId = searchParams?.get("payment_intent_id")
    const paymentMethod = searchParams?.get("payment_method") || "unknown"

    if (!sessionId && !paymentIntentId) {
      console.error("No payment session found")
      setError("Invalid payment session")
      setIsVerifying(false)
      return
    }

    // Simple verification - if we have session ID, assume success
    // In production, you'd verify with your backend
    setIsVerifying(false)
    setShowModal(true)

    // Redirect after a delay
    const redirectTimer = setTimeout(() => {
      router.push("/dashboard")
    }, 5000)

    return () => clearTimeout(redirectTimer)
  }, [searchParams, router])

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <PurchaseSuccessModal open={showModal} onClose={() => setShowModal(false)} />
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    }>
      <PurchaseSuccessContent />
    </Suspense>
  )
} 
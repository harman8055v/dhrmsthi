"use client"

import { useState, useEffect } from "react"
import { Loader2, Phone, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import type { OnboardingData } from "@/lib/types/onboarding"

interface SeedStageProps {
  formData: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
  onNext: (updates: Partial<OnboardingData>) => void
  isLoading: boolean
  user: User | null
  error?: string | null
}

export default function SeedStage({ formData, onChange, onNext, isLoading, user, error }: SeedStageProps) {
  const [mobileNumber, setMobileNumber] = useState(formData.phone || user?.phone || "")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Check if mobile is already verified
  const isAlreadyVerified = formData.mobile_verified || !!user?.phone_confirmed_at

  // Prefill mobile number from user data if available
  useEffect(() => {
    if (user?.phone) {
      const cleanNumber = user.phone.replace("+91", "").replace(/\D/g, "")
      setMobileNumber(cleanNumber)
      // Update form data with the phone number
      onChange({ phone: user.phone })
    }
  }, [user?.phone, onChange])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendOtp = async () => {
    if (!mobileNumber.trim()) {
      setLocalError("Please enter your mobile number")
      return
    }

    // Basic mobile number validation
    const cleanNumber = mobileNumber.replace(/\D/g, "")
    if (cleanNumber.length < 10) {
      setLocalError("Please enter a valid mobile number")
      return
    }

    setSendingOtp(true)
    setLocalError(null)

    try {
      // Format the number for international format
      const formattedNumber = cleanNumber.startsWith("91") ? `+${cleanNumber}` : `+91${cleanNumber}`

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedNumber,
      })

      if (error) {
        console.error("OTP send error:", error)
        setLocalError(error.message || "Failed to send OTP. Please try again.")
        return
      }

      setOtpSent(true)
      setCountdown(60) // 60 second countdown

      // Update form data with mobile number
      onChange({ phone: formattedNumber })
    } catch (error) {
      console.error("Error sending OTP:", error)
      setLocalError("Failed to send OTP. Please try again.")
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setLocalError("Please enter the OTP")
      return
    }

    if (!mobileNumber.trim()) {
      setLocalError("Mobile number is required")
      return
    }

    setVerifying(true)
    setLocalError(null)

    try {
      const cleanNumber = mobileNumber.replace(/\D/g, "")
      const formattedNumber = cleanNumber.startsWith("91") ? `+${cleanNumber}` : `+91${cleanNumber}`

      const { error } = await supabase.auth.verifyOtp({
        phone: formattedNumber,
        token: otp,
        type: "sms",
      })

      if (error) {
        console.error("OTP verification error:", error)
        setLocalError(error.message || "Invalid OTP. Please try again.")
        return
      }

      // OTP verified successfully
      const verificationData = {
        phone: formattedNumber,
        mobile_verified: true,
      }

      // Update form data and proceed to next stage
      onChange(verificationData)
      onNext(verificationData)
    } catch (error) {
      console.error("Error verifying OTP:", error)
      setLocalError("Failed to verify OTP. Please try again.")
    } finally {
      setVerifying(false)
    }
  }

  // Removed skip functionality - mobile verification is now required

  if (isAlreadyVerified) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mobile Already Verified!</h2>
          <p className="text-gray-600">Your mobile number is already verified. Let's continue with your profile.</p>
        </div>

        <div className="flex items-center justify-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-700 font-medium">Mobile verification complete</span>
        </div>

        <Button onClick={() => onNext({ mobile_verified: true })} disabled={isLoading} className="w-full">
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : (
            "Continue to Next Step"
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-4">🌱</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Plant your seed of trust</h2>
        <p className="text-gray-600">Verify your mobile number to ensure secure communication</p>
      </div>

      {!otpSent ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mobile" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Mobile Number
            </Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                +91
              </span>
              <Input
                id="mobile"
                type="tel"
                value={mobileNumber.replace("+91", "")}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10)
                  setMobileNumber(value)
                  setLocalError(null)
                }}
                placeholder="Enter your mobile number"
                className="rounded-l-none"
                maxLength={10}
              />
            </div>
          </div>

          {(localError || error) && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <p className="text-red-700 text-sm">{localError || error}</p>
            </div>
          )}

          <Button onClick={handleSendOtp} disabled={sendingOtp || !mobileNumber.trim()} className="w-full">
            {sendingOtp ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending OTP...
              </span>
            ) : (
              "Send OTP"
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">OTP sent to +91{mobileNumber.replace("+91", "")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                setOtp(value)
                setLocalError(null)
              }}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>

          {(localError || error) && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <p className="text-red-700 text-sm">{localError || error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleVerifyOtp} disabled={verifying || !otp.trim()} className="flex-1">
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify OTP"
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setOtpSent(false)
                setOtp("")
                setLocalError(null)
              }}
              disabled={verifying}
            >
              Change Number
            </Button>
          </div>

          {countdown > 0 ? (
            <p className="text-center text-sm text-gray-500">Resend OTP in {countdown} seconds</p>
          ) : (
            <Button variant="link" onClick={handleSendOtp} disabled={sendingOtp} className="w-full">
              Resend OTP
            </Button>
          )}

          {/* Skip functionality removed - mobile verification is now required */}
        </div>
      )}
    </div>
  )
}

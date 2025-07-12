"use client"

import { useState, useEffect } from "react"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PhoneInput from "@/components/ui/phone-input"
import { formatPhoneE164, isValidPhoneE164 } from "@/lib/utils"
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
  // Prefill mobile number from localStorage if available and no user/phone is set
  const getInitialMobile = () => {
    if (formData.phone) return formData.phone
    if (user?.phone) return user.phone
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('signupData')
        if (raw) {
          const signupData = JSON.parse(raw)
          if (signupData.mobileNumber) return signupData.mobileNumber
        }
      } catch (e) {}
    }
    return ''
  }
  const [mobileNumber, setMobileNumber] = useState<string>(getInitialMobile())
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  // If we came directly from the signup page (no auth user yet) but already have a phone number,
  // an OTP was just sent. Skip the send step and show the OTP input immediately.
  useEffect(() => {
    if (!user && !otpSent && mobileNumber) {
      setOtpSent(true)
      setCountdown(60)
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check if mobile is already verified
  const isAlreadyVerified = formData.mobile_verified || !!user?.phone_confirmed_at

  // Prefill mobile number from user data if available
  useEffect(() => {
    if (user?.phone) {
      setMobileNumber(user.phone)
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
    if (!isValidPhoneE164(mobileNumber)) {
      setLocalError("Please enter a valid mobile number in international format")
      return
    }

    setSendingOtp(true)
    setLocalError(null)

    try {
      const formattedNumber = formatPhoneE164(mobileNumber)
      // Call new backend API to send OTP via WhatsApp
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: formattedNumber, 
          purpose: 'signup',
          userId: user?.id || null 
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLocalError(data.error || 'Failed to send OTP. Please try again.')
        return
      }
      setOtpSent(true)
      setCountdown(60)
      onChange({ phone: formattedNumber })
    } catch (error) {
      setLocalError('Failed to send OTP. Please try again.')
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
      const formattedNumber = formatPhoneE164(mobileNumber)
      // Call new backend API to verify OTP
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedNumber, otp, purpose: 'signup' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setLocalError(data.error || 'Invalid OTP. Please try again.')
        return
      }
      // Mark as verified and proceed
      const verificationData = {
        phone: formattedNumber,
        mobile_verified: true,
      }

      // 📲 Enqueue onboarding WhatsApp message (30-min delay)
      try {
        let firstName = 'Friend'

        // Try localStorage → supports web signup path
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('signupData')
            if (raw) {
              const sd = JSON.parse(raw)
              firstName = sd.first_name || sd.firstName || firstName
            }
          } catch (e) {
            console.warn('[SeedStage] Failed to parse signupData', e)
          }
        }

        // Fallback: if verify response carried existingUser, use that
        if (firstName === 'Friend' && data?.firstName) {
          firstName = data.firstName
        }

        fetch('/api/whatsapp/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.userId ?? null,
            phone: formattedNumber,
            firstName,
          }),
        }).catch(err => console.error('WhatsApp enqueue error:', err))
      } catch (err) {
        console.error('Failed to enqueue WhatsApp message', err)
      }

      onChange(verificationData)
      onNext(verificationData)
    } catch (error) {
      setLocalError('Failed to verify OTP. Please try again.')
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
        <p className="text-gray-600">Verify your mobile number via WhatsApp to ensure secure communication</p>
      </div>

      {!otpSent ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Mobile Number</Label>
            <PhoneInput
              value={mobileNumber}
              onChange={(val) => {
                setMobileNumber(val)
                setLocalError(null)
              }}
              disabled={sendingOtp}
            />
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
              "Send OTP via WhatsApp"
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">OTP sent via WhatsApp to {formatPhoneE164(mobileNumber)}</p>
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
              Resend OTP via WhatsApp
            </Button>
          )}

          {/* Skip functionality removed - mobile verification is now required */}
        </div>
      )}
    </div>
  )
}

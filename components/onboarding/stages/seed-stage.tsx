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

      let error: any = null
      if (user) {
        // If already signed in (email+password), attach phone to this user and send OTP
        const { data: updData, error: updErr } = await supabase.auth.updateUser({
          phone: formattedNumber,
        })
        // Supabase JS v2 does not expose headers, but log everything we get
        console.log('[OTP] updateUser response', {
          location: 'send',
          status: updErr?.status ?? 200,
          message: updErr?.message ?? 'OK',
          data: updData,
        })
        error = updErr
      } else {
        // If not signed in, this is a pure phone signup; send OTP via signInWithOtp
        const { data: signData, error: signErr } = await supabase.auth.signInWithOtp({
          phone: formattedNumber,
          options: { shouldCreateUser: true },
        })
        console.log('[OTP] signInWithOtp response', {
          location: 'send',
          status: signErr?.status ?? 200,
          message: signErr?.message ?? 'OK',
          data: signData,
        })
        error = signErr
      }

      if (error) {
        console.error("OTP send error:", error)
        // Duplicate phone or any other error should surface to user
        if (error.message?.includes("already registered") || error.message?.includes("exists")) {
          setLocalError("This phone number is already linked to another account. Please use a different number or contact support.")
        } else {
          setLocalError(error.message || "Failed to send OTP. Please try again.")
        }
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
      // ────────────────  OTP VERIFY  ────────────────
      const formattedNumber = formatPhoneE164(mobileNumber)

      // Always verify using verifyOtp (works for both logged-in and logged-out flows)
      const verifyType = user ? 'phone_change' : 'sms'
      const { data: verifyData, error: verifyErr } = await supabase.auth.verifyOtp({
        phone: formattedNumber,
        token: otp,
        type: verifyType as any,
      })
      console.log('[OTP] verifyOtp response', {
        location: 'verify',
        type: verifyType,
        status: verifyErr?.status ?? 200,
        message: verifyErr?.message ?? 'OK',
        data: verifyData,
      })
      if (verifyErr && !verifyErr.message?.includes("already confirmed")) {
        console.error("OTP verification error:", verifyErr)
        setLocalError(verifyErr.message || "Invalid OTP. Please try again.")
        return
      }

      // Treat duplicate confirmation as success

      // OTP verified successfully – fetch the fresh auth user (has the final UID)
      const {
        data: { user: freshUser },
        error: userErr,
      } = await supabase.auth.getUser()

      if (userErr || !freshUser) {
        console.error('Failed to read current auth user after OTP verify', userErr)
        setLocalError('Unexpected auth error. Please refresh and try again.')
        return
      }

      // 1️⃣ Pull any buffered signup data from localStorage (set during initial form)
      let buffered: Record<string, any> = {}
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('signupData') : null
        if (raw) buffered = JSON.parse(raw)
      } catch (e) {
        console.warn('Failed to parse buffered signup data', e)
      }

      // 2️⃣ Build initial profile payload
      const initialPayload = {
        id: freshUser.id,
        phone: formattedNumber,
        mobile_verified: true,
        email: buffered.email || null,
        full_name: buffered.full_name || null,
        first_name: buffered.first_name || null,
        last_name: buffered.last_name || null,
        gender: buffered.gender || null,
        birthdate: buffered.birthdate || null,
        // mark onboarding not done yet – rest of stages will update
        is_onboarded: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // 3️⃣ Upsert row in public.users
      const { error: upsertErr } = await supabase
        .from('users')
        .upsert(initialPayload, { onConflict: 'id', ignoreDuplicates: false })
        .single()

      if (upsertErr && !upsertErr.message?.includes('duplicate')) {
        console.error('Initial profile upsert error:', upsertErr)
        setLocalError('Failed to create profile. Please try again.')
        return
      }

      // 4️⃣ Clear buffered data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('signupData')
      }

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
              "Send OTP"
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">OTP sent to {formatPhoneE164(mobileNumber)}</p>
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

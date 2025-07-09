"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useAuthContext } from "@/components/auth-provider"
import MobileNav from "@/components/dashboard/mobile-nav"
import { toast } from "sonner"
import { Loader2, Shield, Mail, Phone, Lock, Pause, Trash2 } from "lucide-react"

export default function AccountSettingsPage() {
  const { user, profile, refreshProfile } = useAuthContext()
  const router = useRouter()

  const [loading, setLoading] = useState(true)

  // Email + Phone state
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [updatingEmail, setUpdatingEmail] = useState(false)
  const [updatingPhone, setUpdatingPhone] = useState(false)
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneOtp, setPhoneOtp] = useState("")
  const [verifyingPhone, setVerifyingPhone] = useState(false)
  const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" })
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [pausing, setPausing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (profile) {
      setEmail(profile.email || user?.email || "")
      setPhone(profile.phone || user?.phone || "")
      setLoading(false)
    }
  }, [profile, user])

  /* ------------ EMAIL HANDLING ------------- */
  const handleEmailUpdate = async () => {
    if (!email) return
    setUpdatingEmail(true)
    try {
      // Supabase will send a confirmation link to new email
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw error
      toast.info("Confirmation link sent to new email. Please verify to complete update.")
    } catch (error: any) {
      console.error("Email update error", error)
      toast.error(error.message || "Failed to update email")
    } finally {
      setUpdatingEmail(false)
    }
  }

  /* ------------ PHONE HANDLING ------------- */
  const handlePhoneSendOtp = async () => {
    if (!phone) return
    setUpdatingPhone(true)
    try {
      const { error } = await supabase.auth.updateUser({ phone })
      if (error) throw error
      setPhoneOtpSent(true)
      toast.success("OTP sent to new phone number")
    } catch (error: any) {
      console.error("Phone update error", error)
      toast.error(error.message || "Failed to send OTP")
    } finally {
      setUpdatingPhone(false)
    }
  }

  const handlePhoneVerifyOtp = async () => {
    if (!phoneOtp) return
    setVerifyingPhone(true)
    try {
      const { error } = await supabase.auth.verifyOtp({ phone, token: phoneOtp, type: "sms" })
      if (error) throw error
      toast.success("Phone number updated and verified")
      setPhoneOtp("")
      setPhoneOtpSent(false)
      await refreshProfile()
    } catch (error: any) {
      console.error("OTP verify error", error)
      toast.error(error.message || "Failed to verify OTP")
    } finally {
      setVerifyingPhone(false)
    }
  }

  /* ------------ PASSWORD HANDLING ------------- */
  const handlePasswordUpdate = async () => {
    const { current, new: newPwd, confirm } = passwordData
    if (!current || !newPwd || newPwd !== confirm) {
      toast.error("Please fill all password fields correctly")
      return
    }
    setUpdatingPassword(true)
    try {
      // Re-authenticate not required with supabase – just update password
      const { error } = await supabase.auth.updateUser({ password: newPwd })
      if (error) throw error
      toast.success("Password updated successfully")
      setPasswordData({ current: "", new: "", confirm: "" })
    } catch (error: any) {
      console.error("Password change error", error)
      toast.error(error.message || "Failed to update password")
    } finally {
      setUpdatingPassword(false)
    }
  }

  /* ------------ PAUSE ACCOUNT ------------- */
  const handlePauseAccount = async () => {
    if (!user) return
    setPausing(true)
    try {
      const { error } = await supabase.from("users").update({ account_status: "deactivated" }).eq("id", user.id)
      if (error) throw error
      toast.success("Account paused. You can reactivate by logging in again.")
      await refreshProfile()
    } catch (error: any) {
      console.error("Pause error", error)
      toast.error(error.message || "Failed to pause account")
    } finally {
      setPausing(false)
    }
  }

  /* ------------ DELETE ACCOUNT ------------- */
  const handleDeleteAccount = async () => {
    if (!user) return
    if (!confirm("Are you sure? This cannot be undone.")) return
    setDeleting(true)
    try {
      // Mark as deleted – real deletion handled by backend / admin
      const { error } = await supabase.from("users").update({ account_status: "deleted" }).eq("id", user.id)
      if (error) throw error
      await supabase.auth.signOut()
      router.push("/")
    } catch (error: any) {
      console.error("Delete error", error)
      toast.error(error.message || "Failed to delete account")
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <MobileNav userProfile={profile} />

      <main className="pt-24 pb-40 px-4 min-h-screen max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Account Settings</h1>

        {/* Verification Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Verification</CardTitle>
            <CardDescription>Your current verification status:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="default">
              <AlertTitle>Status: {profile?.verification_status || "pending"}</AlertTitle>
              <AlertDescription>
                {profile?.verification_status === "verified"
                  ? "Your profile is verified."
                  : "We’re reviewing your profile. This usually takes 24-48 hours."}
              </AlertDescription>
            </Alert>

            {!profile?.is_onboarded && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">To get verified faster, please complete your profile details.</p>
                <Button onClick={() => router.push("/dashboard/settings")} className="bg-gradient-to-r from-orange-500 to-pink-500">
                  Complete Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email and phone change temporarily disabled */}

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5" /> Password</CardTitle>
            <CardDescription>Change your account password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label>Current Password</Label>
                <Input type="password" value={passwordData.current} onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })} />
              </div>
              <div>
                <Label>New Password</Label>
                <Input type="password" value={passwordData.new} onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })} />
              </div>
              <div>
                <Label>Confirm New Password</Label>
                <Input type="password" value={passwordData.confirm} onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })} />
              </div>
            </div>
            <Button onClick={handlePasswordUpdate} disabled={updatingPassword} className="bg-gradient-to-r from-orange-500 to-pink-500">
              {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change Password"}
            </Button>
          </CardContent>
        </Card>

        {/* Pause / Delete */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Pause className="w-5 h-5" /> Pause Account</CardTitle>
            <CardDescription>Temporarily hide your profile and stop all notifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handlePauseAccount} disabled={pausing} variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
              {pausing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pause Account"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Trash2 className="w-5 h-5" /> Delete Account</CardTitle>
            <CardDescription>This action is irreversible.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDeleteAccount} disabled={deleting} variant="destructive">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete My Account"}
            </Button>
          </CardContent>
        </Card>

        {/* Support note */}
        <p className="text-xs text-gray-500 text-center pt-6">
          Need to change your email or phone number?&nbsp;
          <br className="sm:hidden" />Please contact&nbsp;
          <a href="mailto:support@dharmasaathi.com" className="underline">support@dharmasaathi.com</a>.&nbsp;
          We require manual verification to maintain the highest level of security.
        </p>
      </main>
    </div>
  )
} 
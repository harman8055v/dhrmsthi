"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export default function PasswordRecoveryClient() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [justSent, setJustSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSent(false)
    setJustSent(false)
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `https://dharmasaathi.com/reset-password` }
      )
      if (error) throw error
      setSent(true)
      setJustSent(true)
      setTimeout(() => setJustSent(false), 2000)
    } catch (err: any) {
      setError(err?.message || "Could not send reset link")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-[#8b0000]">Password recovery</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-6">
            Enter your account email and we’ll send you a password reset link.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {sent ? (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Reset link sent. Please check your inbox and your spam folder.
              </div>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  The link is only valid for about an hour or less. If it doesn’t work,
                  do not try to use the same one—request a new link from this page.
                </p>
                <p>
                  Didn’t get it? You can try sending again to the same email address.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="you@email.com"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading || justSent}
                  className={`w-full font-semibold py-3 transition-all duration-200 rounded-lg shadow-lg flex items-center justify-center gap-2 ${justSent ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gradient-to-r from-[#8b0000] to-[#a30000] hover:from-[#a30000] hover:to-[#8b0000] text-white'}`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : justSent ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Sent!
                    </>
                  ) : (
                    "Send another reset link"
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="you@email.com"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading || justSent}
                className={`w-full font-semibold py-3 transition-all duration-200 rounded-lg shadow-lg flex items-center justify-center gap-2 ${justSent ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gradient-to-r from-[#8b0000] to-[#a30000] hover:from-[#a30000] hover:to-[#8b0000] text-white'}`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : justSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Sent!
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>

              <div className="text-xs text-gray-600">
                <p>
                  We’ll email you a secure link to reset your password. It’s valid for about an hour or less.
                </p>
                <p className="mt-2">
                  After submitting, please check your inbox and spam folder.
                </p>
                <p className="mt-2">
                  If the link does not work, do not try to reuse it—request a new link here.
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



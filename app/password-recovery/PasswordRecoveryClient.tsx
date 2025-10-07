"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mail, Loader2, CheckCircle2, AlertCircle, Link as LinkIcon } from "lucide-react"

export default function PasswordRecoveryClient() {
  const [magicEmail, setMagicEmail] = useState("")
  const [magicLoading, setMagicLoading] = useState(false)
  const [magicError, setMagicError] = useState<string | null>(null)
  const [magicSent, setMagicSent] = useState(false)
  const [magicJustSent, setMagicJustSent] = useState(false)

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center px-4 sm:px-6 py-12 bg-gradient-to-b from-gray-50 to-white">
      <Card className="w-full max-w-md border border-gray-100 shadow-md rounded-xl backdrop-blur-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-[#8b0000]">
            <LinkIcon className="w-5 h-5" /> Magic login link (no password)
          </CardTitle>
          <CardDescription>
            A magic login link lets you sign in directly from your registered email address—no password needed. If your password reset isn’t working, you can request a magic login link instead.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">

            {magicError && (
              <div role="alert" aria-live="assertive" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {magicError}
              </div>
            )}

            {magicSent ? (
              <div className="space-y-4">
                <div role="status" aria-live="polite" aria-atomic="true" className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Magic login link sent. Please check your inbox and spam folder.
                </div>
                <form
                  onSubmit={async e => {
                    e.preventDefault()
                    setMagicError(null)
                    setMagicJustSent(false)
                    setMagicLoading(true)
                    try {
                      const { error } = await supabase.auth.signInWithOtp({
                        email: magicEmail,
                        options: {
                          emailRedirectTo: `https://dharmasaathi.com/auth-loading`,
                        },
                      })
                      if (error) throw error
                      setMagicJustSent(true)
                      setTimeout(() => setMagicJustSent(false), 2000)
                    } catch (err: any) {
                      setMagicError(err?.message || "Could not send magic link")
                    } finally {
                      setMagicLoading(false)
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="magic-email-again" className="text-gray-700 font-medium">Email Address</Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input
                        id="magic-email-again"
                        type="email"
                        value={magicEmail}
                        onChange={e => setMagicEmail(e.target.value)}
                        className="pl-10"
                        autoComplete="email"
                        inputMode="email"
                        autoFocus
                        aria-invalid={!!magicError}
                        aria-describedby="magic-help"
                        placeholder="you@email.com"
                        disabled={magicLoading}
                        required
                      />
                    </div>
                    <p id="magic-help" className="sr-only">We’ll email you a one-time login link that signs you in directly.</p>
                  </div>
                  <Button
                    type="submit"
                    disabled={magicLoading || magicJustSent}
                    className={`w-full font-semibold py-3 transition-all duration-200 rounded-lg shadow-lg flex items-center justify-center gap-2 ${magicJustSent ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gradient-to-r from-[#8b0000] to-[#a30000] hover:from-[#a30000] hover:to-[#8b0000] text-white'}`}
                    aria-busy={magicLoading}
                    title="Send magic login link again"
                  >
                    {magicLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : magicJustSent ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Sent!
                      </>
                    ) : (
                      "Send another magic link"
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <form
                onSubmit={async e => {
                  e.preventDefault()
                  setMagicError(null)
                  setMagicSent(false)
                  setMagicJustSent(false)
                  setMagicLoading(true)
                  try {
                    const { error } = await supabase.auth.signInWithOtp({
                      email: magicEmail,
                      options: {
                        emailRedirectTo: `https://dharmasaathi.com/auth-loading`,
                      },
                    })
                    if (error) throw error
                    setMagicSent(true)
                    setMagicJustSent(true)
                    setTimeout(() => setMagicJustSent(false), 2000)
                  } catch (err: any) {
                    setMagicError(err?.message || "Could not send magic link")
                  } finally {
                    setMagicLoading(false)
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="magic-email" className="text-gray-700 font-medium">Email Address</Label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="magic-email"
                      type="email"
                      value={magicEmail}
                      onChange={e => setMagicEmail(e.target.value)}
                      className="pl-10"
                      autoComplete="email"
                      inputMode="email"
                      autoFocus
                      aria-invalid={!!magicError}
                      aria-describedby="magic-help"
                      placeholder="you@email.com"
                      disabled={magicLoading}
                      required
                    />
                  </div>
                  <p id="magic-help" className="sr-only">We’ll email you a one-time login link that signs you in directly.</p>
                </div>
                <Button
                  type="submit"
                  disabled={magicLoading || magicJustSent}
                  className={`w-full font-semibold py-3 transition-all duration-200 rounded-lg shadow-lg flex items-center justify-center gap-2 ${magicJustSent ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gradient-to-r from-[#8b0000] to-[#a30000] hover:from-[#a30000] hover:to-[#8b0000] text-white'}`}
                  aria-busy={magicLoading}
                  title="Send magic login link"
                >
                  {magicLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : magicJustSent ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Sent!
                    </>
                  ) : (
                    "Send magic login link"
                  )}
                </Button>
                <div className="text-xs text-gray-600">
                  <p>We’ll email you a one-time login link that signs you in directly.</p>
                  <p className="mt-2">This is useful if your password reset link isn’t working.</p>
                </div>
              </form>
            )}
        </CardContent>
      </Card>
    </div>
  )
}



"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"

export default function ResetPasswordClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const code = searchParams.get("code")
  const type = searchParams.get("type")

  const [status, setStatus] = useState<"verifying" | "verified" | "done" | "error">("verifying")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [updating, setUpdating] = useState(false)

  // Validate the reset-password link on mount. We now support three scenarios:
  // 1) PKCE flow – ?code=… (exchangeCodeForSession)
  // 2) Implicit flow – ?/#!access_token=…&refresh_token=… (setSession)
  // 3) Supabase already placed a valid session in localStorage (getSession)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    let subscriptionCleanup: (() => void) | null = null

    const verify = async () => {
      // We re-parse search / hash here to capture possible tokens that weren’t
      // available through the initial useSearchParams (hash is not included).
      const search = new URLSearchParams(window.location.search)
      const hash = new URLSearchParams(window.location.hash.slice(1))

      const codeParam = search.get("code")
      const accessToken = search.get("access_token") || hash.get("access_token")
      const refreshToken = search.get("refresh_token") || hash.get("refresh_token")

      let authError: any = null

      if (codeParam) {
        // PKCE
        ;({ error: authError } = await supabase.auth.exchangeCodeForSession(codeParam))
      } else if (accessToken && refreshToken) {
        // Implicit / hash flow
        ;({ error: authError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }))
      } else {
        // Maybe Supabase already created a session (redirect_to flow) but it can
        // take a brief moment for the client to hydrate from localStorage. We
        // check once immediately and, if no session found, we subscribe to the
        // auth state change event for up to ~3 seconds before giving up.
        const attemptImmediate = await supabase.auth.getSession()
        if (attemptImmediate.data.session) {
          setStatus("verified")
          return
        }

        // Wait for a future auth event.
        timeoutId = setTimeout(() => {
          setErrorMsg("This reset link is invalid or has expired. Please request a new one.")
          setStatus("error")
        }, 3000)

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session) {
            if (timeoutId) clearTimeout(timeoutId)
            setStatus("verified")
          }
        })

        subscriptionCleanup = () => listener.subscription.unsubscribe()
      }

      if (authError) {
        console.error("Password-reset auth error", authError)
        setErrorMsg("This reset link is invalid or has expired. Please request a new one.")
        setStatus("error")
      } else {
        setStatus("verified")
      }
    }

    verify()

    // Cleanup when effect unmounts
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (subscriptionCleanup) subscriptionCleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setErrorMsg("Passwords do not match")
      return
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long")
      return
    }

    setUpdating(true)
    setErrorMsg(null)
    const { error } = await supabase.auth.updateUser({ password })
    setUpdating(false)
    if (error) {
      console.error(error)
      setErrorMsg(error.message)
    } else {
      setStatus("done")
      await supabase.auth.signOut()
      setTimeout(() => {
        router.push("/login?reset=success")
      }, 2000)
    }
  }

  const renderVerifying = () => (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-4 py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p>Validating reset link…</p>
      </CardContent>
    </Card>
  )

  const renderError = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col items-center gap-2">
        <AlertTriangle className="w-8 h-8 text-red-600" />
        <CardTitle>Invalid reset link</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="mb-4 text-sm text-muted-foreground">{errorMsg}</p>
        <Button onClick={() => router.push("/")}>Back to home</Button>
      </CardContent>
    </Card>
  )

  const renderForm = () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
      </CardHeader>
      <CardContent>
        {errorMsg && <p className="mb-3 text-sm text-red-600">{errorMsg}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={updating}
          />
          <Input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={updating}
          />
          <Button type="submit" disabled={updating} className="w-full">
            {updating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Updating…
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )

  const renderDone = () => (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col items-center gap-2">
        <CheckCircle className="w-8 h-8 text-green-600" />
        <CardTitle>Password updated!</CardTitle>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        You’ll be redirected to sign-in shortly…
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      {status === "verifying" && renderVerifying()}
      {status === "verified" && renderForm()}
      {status === "done" && renderDone()}
      {status === "error" && renderError()}
    </div>
  )
} 
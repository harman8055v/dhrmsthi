'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"

export default function ResetPasswordClient() {
  const router = useRouter()

  const [status, setStatus] = useState<'verifying' | 'verified' | 'done' | 'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const doVerify = async () => {
      // 1️⃣ If you already have a valid session, skip straight to the form:
      const { data: sessData } = await supabase.auth.getSession()
      if (sessData.session) {
        setStatus('verified')
        return
      }
      // 2️⃣ Otherwise, exchange the code/hash from the URL:
      const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true })
      if (error || !data.session) {
        console.error('getSessionFromUrl error:', error)
        setErrorMsg('This reset link is invalid or has expired. Please request a new one.')
        setStatus('error')
      } else {
        setStatus('verified')
      }
    }
    doVerify()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setErrorMsg('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long')
      return
    }

    setUpdating(true)
    setErrorMsg(null)
    const { error } = await supabase.auth.updateUser({ password })
    setUpdating(false)

    if (error) {
      console.error('updateUser error:', error)
      setErrorMsg(error.message)
    } else {
      setStatus('done')
      await supabase.auth.signOut()
      setTimeout(() => router.push('/login?reset=success'), 2000)
    }
  }

  const renderVerifying = (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-4 py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p>Validating reset link…</p>
      </CardContent>
    </Card>
  )

  const renderError = (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col items-center gap-2">
        <AlertTriangle className="w-8 h-8 text-red-600" />
        <CardTitle>Invalid reset link</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="mb-4 text-sm text-muted-foreground">{errorMsg}</p>
        <Button onClick={() => router.push('/')}>Back to home</Button>
      </CardContent>
    </Card>
  )

  const renderForm = (
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
            onChange={e => setPassword(e.target.value)}
            disabled={updating}
          />
          <Input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            disabled={updating}
          />
          <Button type="submit" disabled={updating} className="w-full">
            {updating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />Updating…
              </>
            ) : (
              'Update password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )

  const renderDone = (
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
      {status === 'verifying' && renderVerifying}
      {status === 'error' && renderError}
      {status === 'verified' && renderForm}
      {status === 'done' && renderDone}
    </div>
  )
}

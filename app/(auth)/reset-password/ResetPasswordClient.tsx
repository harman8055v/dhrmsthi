'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

export default function ResetPasswordClient() {
  const router = useRouter()

  const [status, setStatus] = useState<'verifying'|'verified'|'done'|'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState<string|null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const parseLink = async () => {
      if (typeof window === 'undefined') return;
      // Hash flow
      if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.substring(1))
        const access_token  = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (!error) {
            setStatus('verified')
            return
          }
        }
      }
      // Code flow
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          setStatus('verified')
          return
        }
      }
    }
    parseLink()

    // 3) Still listen for PASSWORD_RECOVERY as a backup
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('verified')
      }
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setErrorMsg('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setErrorMsg('Must be at least 8 characters')
      return
    }

    setUpdating(true)
    setErrorMsg(null)

    const { error } = await supabase.auth.updateUser({ password })
    setUpdating(false)

    if (error) {
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
            {updating
              ? <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2"/>Updating…
                </>
              : 'Update password'}
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
        Redirecting to sign-in…
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      {status === 'verifying' && renderVerifying}
      {status === 'error'     && renderError}
      {status === 'verified'  && renderForm}
      {status === 'done'      && renderDone}
    </div>
  )
}

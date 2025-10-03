'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function ResetPasswordClient() {
  const router = useRouter()
  const supabase = createClient()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let recoveryComplete = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' && !recoveryComplete) {
        recoveryComplete = true
        setReady(true)
      } else if (event === 'SIGNED_IN') {
        // This can happen if the user is already logged in in another tab.
        // We allow them to proceed with password change.
        setReady(true)
      }
    })

    // Also check for existing session on mount, in case the page was reloaded
    // after the recovery link was clicked.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true)
      }
    }).finally(() => {
        // If after a short delay there's no session and no recovery event, show an error.
        // This handles expired/invalid links.
        setTimeout(() => {
            if (!recoveryComplete) {
                const url = new URL(window.location.href)
                const errorDesc = url.searchParams.get('error_description')
                if (errorDesc) {
                    setError(errorDesc)
                } else if (!ready) {
                    // Fallback for when no session is found after a timeout
                    setError("Invalid or expired password reset link. Please request a new one.")
                }
            }
        }, 3000)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, ready])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    setMessage('Your password has been reset successfully!')
    try { await supabase.auth.signOut() } catch {}
    
    // Redirect after a short delay to allow the user to read the message
    setTimeout(() => {
        router.push('/?reset=success&login=1')
    }, 2000)
  }

  if (error && !ready) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-muted p-4">
            <Card className="w-full max-w-md">
                <CardContent className="flex flex-col items-center gap-4 py-10">
                    <p className="text-red-600">{error}</p>
                    <Button onClick={() => router.push('/')}>Go to Homepage</Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying password reset link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>
            )}
            {message && (
                <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">{message}</div>
            )}
            <div>
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

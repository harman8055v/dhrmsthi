'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function ResetPasswordClient() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    checkPasswordResetCode()
  }, [])

  const checkPasswordResetCode = async () => {
    // Check for code parameter in URL
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    
    if (code) {
      // We have a code, show the password reset form
      setIsReady(true)
      // Clean up the URL
      window.history.replaceState({}, document.title, '/reset-password')
    } else {
      // No code, show error
      setError('Invalid or expired password reset link. Please request a new one.')
    }
  }

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
    
    // Fire the update request
    supabase.auth.updateUser({ password: password })
    
    // Show success message and redirect immediately
    setTimeout(() => {
      setMessage('Your password has been reset successfully!')
      setSubmitting(false)
    }, 500)
    
    // Redirect after showing message
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }

  // Show error state
  if (error && !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <p className="text-red-600 text-center">{error}</p>
            <Button onClick={() => router.push('/')}>Go to Homepage</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading if not ready
  if (!isReady) {
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

  // Show password reset form
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
            {!message && (
              <>
                <div>
                  <Input
                    type="password"
                    placeholder="New password (minimum 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    required
                    minLength={8}
                    autoFocus
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
                    minLength={8}
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
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
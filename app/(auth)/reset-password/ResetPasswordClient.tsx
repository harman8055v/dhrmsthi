'use client'

import { useEffect, useState, useRef } from 'react'
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
  const hasProcessedCode = useRef(false)

  useEffect(() => {
    checkPasswordResetCode()
  }, [])

  const checkPasswordResetCode = async () => {
    console.log('[ResetPassword] Checking for password reset code...')
    
    // Check for code parameter in URL
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    const errorDesc = url.searchParams.get('error_description')
    
    console.log('[ResetPassword] URL params:', { code: !!code, errorDesc })
    
    // Handle errors
    if (errorDesc) {
      setError(errorDesc)
      return
    }
    
    // If we have a code and haven't processed it yet, we're in password reset mode
    if (code && !hasProcessedCode.current) {
      console.log('[ResetPassword] Password reset code detected!')
      hasProcessedCode.current = true
      
      // The code has already been exchanged for a session by Supabase
      // We just need to show the password reset form
      setIsReady(true)
      
      // Clean up the URL
      window.history.replaceState({}, document.title, '/reset-password')
      return
    }
    
    // If no code, check if this is a direct visit
    const { data: { session } } = await supabase.auth.getSession()
    if (!code && !session) {
      console.log('[ResetPassword] No code and no session - invalid access')
      setError('Invalid or expired password reset link. Please request a new one.')
      return
    }
    
    // If we have a session but no code, user is just logged in normally
    if (session && !code) {
      console.log('[ResetPassword] User is logged in but no reset code - redirecting to login')
      // Sign out and redirect to login page
      await supabase.auth.signOut()
      router.push('/login')
      return
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

    console.log('[ResetPassword] Updating password...')
    setSubmitting(true)
    
    // Fire the update request
    supabase.auth.updateUser({ password: password }).then(({ error }) => {
      if (error) {
        console.error('[ResetPassword] Update error:', error)
      } else {
        console.log('[ResetPassword] Password update request sent')
      }
    })
    
    // Show success message and redirect immediately
    setTimeout(() => {
      setMessage('Your password has been reset successfully!')
      setSubmitting(false)
    }, 500)
    
    // Sign out and redirect after showing message
    setTimeout(async () => {
      // Sign out the session created by password reset
      await supabase.auth.signOut()
      // Set flag for login page to know we're coming from password reset
      sessionStorage.setItem('password-reset-success', 'true')
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
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
  const sessionRef = useRef<any>(null)

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
      
      // Wait for Supabase to process the code
      console.log('[ResetPassword] Waiting for session...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Get the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('[ResetPassword] Session check:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        sessionError 
      })
      
      if (sessionError || !session) {
        setError('Failed to establish session. Please request a new password reset link.')
        return
      }
      
      // Store session reference
      sessionRef.current = session
      setIsReady(true)
      
      // Clean up the URL
      window.history.replaceState({}, document.title, '/reset-password')
      return
    }
    
    // If no code, invalid access
    setError('Invalid or expired password reset link. Please request a new one.')
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

    console.log('[ResetPassword] Starting password update...')
    setSubmitting(true)
    
    try {
      // Try direct API call as a last resort
      if (sessionRef.current?.access_token) {
        console.log('[ResetPassword] Attempting direct API call...')
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionRef.current.access_token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          },
          body: JSON.stringify({ password })
        })
        
        const data = await response.json()
        console.log('[ResetPassword] API response:', { status: response.status, data })
        
        if (!response.ok) {
          throw new Error(data.msg || data.error || 'Failed to update password')
        }
        
        console.log('[ResetPassword] Password updated successfully via API!')
        setMessage('Your password has been reset successfully!')
        setSubmitting(false)
        
        // Sign out and redirect
        supabase.auth.signOut().catch(e => {
          console.log('[ResetPassword] Signout error (ignored):', e)
        })
        
        setTimeout(() => {
          router.push('/?reset=success&login=1')
        }, 1500)
      } else {
        // Fallback to SDK method
        console.log('[ResetPassword] No access token, trying SDK method...')
        
        const { error: updateError } = await supabase.auth.updateUser({ 
          password: password 
        })
        
        if (updateError) {
          throw updateError
        }
        
        console.log('[ResetPassword] Password updated successfully via SDK!')
        setMessage('Your password has been reset successfully!')
        setSubmitting(false)
        
        setTimeout(() => {
          router.push('/?reset=success&login=1')
        }, 1500)
      }
      
    } catch (err: any) {
      console.error('[ResetPassword] Error:', err)
      
      const errorMessage = err.message || 'Failed to update password'
      if (errorMessage.includes('session missing') || errorMessage.includes('expired')) {
        setError('Password reset link has expired or already been used. Please request a new one.')
      } else {
        setError(errorMessage)
      }
      setSubmitting(false)
    }
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
            <p className="text-muted-foreground">Processing password reset link...</p>
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
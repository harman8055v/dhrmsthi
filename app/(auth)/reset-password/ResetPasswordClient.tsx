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
  const [showForm, setShowForm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [processingAuth, setProcessingAuth] = useState(true)

  useEffect(() => {
    handlePasswordReset()
  }, [])

  const handlePasswordReset = async () => {
    console.log('[ResetPassword] Starting password reset handler...')
    console.log('[ResetPassword] Current URL:', window.location.href)
    
    // Check URL parameters (both query and hash)
    const url = new URL(window.location.href)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    
    // Recovery parameters can be in query OR hash
    const accessToken = url.searchParams.get('access_token') || hashParams.get('access_token')
    const type = url.searchParams.get('type') || hashParams.get('type')
    const errorDesc = url.searchParams.get('error_description') || hashParams.get('error_description')
    const errorCode = url.searchParams.get('error_code') || hashParams.get('error_code')
    
    console.log('[ResetPassword] Recovery params:', {
      hasAccessToken: !!accessToken,
      type,
      errorDesc,
      errorCode,
      inQuery: !!url.searchParams.get('access_token'),
      inHash: !!hashParams.get('access_token')
    })
    
    // Check for errors first
    if (errorDesc || errorCode) {
      console.log('[ResetPassword] Error found in URL')
      setError(errorDesc || 'Invalid or expired password reset link. Please request a new one.')
      setProcessingAuth(false)
      return
    }
    
    // If we have recovery parameters, we need to handle them
    if (type === 'recovery' && accessToken) {
      console.log('[ResetPassword] Recovery link detected, checking current session...')
      
      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[ResetPassword] Current session:', {
        hasSession: !!session,
        userId: session?.user?.id
      })
      
      if (session) {
        console.log('[ResetPassword] User is logged in, signing out first...')
        await supabase.auth.signOut()
        // Small delay to ensure sign out completes
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      console.log('[ResetPassword] Processing recovery link...')
      // Let Supabase process the recovery link by refreshing the page
      // This will trigger the PASSWORD_RECOVERY event
      window.location.reload()
      return
    }
    
    // Set up listener for PASSWORD_RECOVERY event
    console.log('[ResetPassword] Setting up auth state listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[ResetPassword] Auth event:', event, 'Session:', !!session)
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[ResetPassword] PASSWORD_RECOVERY event received!')
        setShowForm(true)
        setProcessingAuth(false)
      } else if (event === 'INITIAL_SESSION') {
        // Check session state after a delay
        setTimeout(async () => {
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          if (!showForm && processingAuth) {
            if (currentSession && !type) {
              console.log('[ResetPassword] User logged in without recovery params')
              setError('You are already logged in. To reset your password, please log out first and request a new password reset link.')
            } else if (!currentSession && !type) {
              console.log('[ResetPassword] No session and no recovery params')
              setError('Invalid or expired password reset link. Please request a new one.')
            }
            setProcessingAuth(false)
          }
        }, 2000)
      }
    })
    
    // Cleanup
    return () => {
      console.log('[ResetPassword] Cleaning up...')
      subscription.unsubscribe()
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
    
    const { error } = await supabase.auth.updateUser({ password })
    
    setSubmitting(false)

    if (error) {
      console.error('[ResetPassword] Update error:', error)
      setError(error.message)
      return
    }

    console.log('[ResetPassword] Password updated successfully!')
    setMessage('Your password has been reset successfully!')
    
    // Sign out to ensure clean state
    try { 
      await supabase.auth.signOut() 
    } catch (e) {
      console.error('[ResetPassword] Signout error:', e)
    }
    
    // Redirect after a short delay
    setTimeout(() => {
      router.push('/?reset=success&login=1')
    }, 2000)
  }

  // Show error state
  if (error && !showForm && !processingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <p className="text-red-600 text-center">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/')}>Go to Homepage</Button>
              {error.includes('already logged in') && (
                <Button 
                  variant="outline" 
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/')
                  }}
                >
                  Log Out
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading state
  if (!showForm || processingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">
              {processingAuth ? 'Processing password reset link...' : 'Verifying password reset link...'}
            </p>
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
            <div>
              <Input
                type="password"
                placeholder="New password (minimum 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
                minLength={8}
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
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
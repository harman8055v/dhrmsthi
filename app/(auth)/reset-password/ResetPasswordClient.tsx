'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle } from 'lucide-react'

export default function ResetPasswordClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isReady, setIsReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // Check for URL parameters first (from email link)
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const type = searchParams.get('type')
        
        // If we have tokens in URL, try to establish a session
        if (accessToken && refreshToken) {
          console.log('Found tokens in URL, establishing session...')
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (error) {
            console.error('Failed to set session from URL tokens:', error)
            setError('Invalid or expired reset link. Please request a new password reset.')
            return
          }
          
          if (data.session) {
            console.log('Session established successfully')
            setIsReady(true)
            return
          }
        }
        
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Current session:', session)
        
        if (session) {
          setIsReady(true)
          return
        }
        
        // Listen for auth state changes (fallback)
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth event:', event, 'Session:', session)
          
          if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
            setIsReady(true)
          }
        })
        
        // If no session and no tokens, show error after a delay
        const timeout = setTimeout(() => {
          if (!isReady) {
            setError('Invalid or expired reset link. Please request a new password reset.')
          }
        }, 5000) // Wait 5 seconds before showing error
        
        return () => {
          authListener.subscription.unsubscribe()
          clearTimeout(timeout)
        }
        
      } catch (err) {
        console.error('Password reset initialization error:', err)
        setError('Something went wrong. Please try again.')
      }
    }
    
    handlePasswordReset()
  }, [searchParams, isReady])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setUpdating(true)

    try {
      // Update the user's password
      const { data, error } = await supabase.auth.updateUser({ 
        password: password 
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        // Sign out and redirect to login after 2 seconds
        setTimeout(async () => {
          await supabase.auth.signOut()
          router.push('/login?reset=success')
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setUpdating(false)
    }
  }

  // Show loading while checking auth state
  if (!isReady && !error && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying reset link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error if reset link is invalid
  if (error && !isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-xl">✕</span>
            </div>
            <h2 className="text-xl font-semibold text-red-600">Reset Link Invalid</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button 
              onClick={() => router.push('/login')}
              className="mt-4"
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show success message
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <CheckCircle className="w-12 h-12 text-green-600" />
            <h2 className="text-xl font-semibold">Password Updated!</h2>
            <p className="text-muted-foreground">Redirecting to login...</p>
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
          <CardTitle>Reset Your Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            
            <div>
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={updating}
                required
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={updating}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={updating || !password || !confirmPassword}
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating Password...
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

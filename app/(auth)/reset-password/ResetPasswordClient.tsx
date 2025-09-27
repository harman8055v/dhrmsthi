'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle } from 'lucide-react'
import { logger } from '@/lib/logger'

export default function ResetPasswordClient() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    logger.log('[Reset Password] Component mounted, setting up auth listener...')
    logger.log(`[Reset Password] Full URL: ${window.location.href}`)
    
    // EXACTLY as per Supabase docs - just listen for PASSWORD_RECOVERY
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.log(`[Reset Password] Auth event: ${event}, Session: ${session ? 'present' : 'null'}`)
      
      if (event === "PASSWORD_RECOVERY") {
        logger.log('[Reset Password] PASSWORD_RECOVERY event received! Showing form...')
        setShowForm(true)
      }
      
      // If we see USER_UPDATED while updating, it means password was changed
      if (event === "USER_UPDATED" && updating) {
        logger.log('[Reset Password] USER_UPDATED event detected during password update - marking as success')
        setUpdating(false)
        setSuccess(true)
        
        setTimeout(() => {
          window.location.href = '/?reset=success'
        }, 2000)
      }
    })

    // Check if already has session (in case user refreshed page)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        logger.log(`[Reset Password] Found existing session: ${session.user?.email}`)
        setShowForm(true)
      } else {
        logger.log('[Reset Password] No existing session')
      }
    })

    // Timeout - if no PASSWORD_RECOVERY event after 15 seconds
    const timeout = setTimeout(() => {
      if (!showForm) {
        logger.log('[Reset Password] Timeout - PASSWORD_RECOVERY event never fired')
        setError('This reset link appears to be invalid or expired. Please request a new password reset.')
      }
    }, 15000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [showForm, updating])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setUpdating(true)
    logger.log('[Reset Password] Updating password...')
    
    // Fallback timer in case state gets stuck
    const fallbackTimer = setTimeout(() => {
      if (updating) {
        logger.log('[Reset Password] Fallback: Force clearing updating state after 10 seconds')
        setUpdating(false)
        setError('Password update took too long. Please try again or refresh the page.')
      }
    }, 10000)

    try {
      // EXACTLY as per Supabase docs
      const { data, error } = await supabase.auth.updateUser({
        password: password
      })

      clearTimeout(fallbackTimer)

      if (error) {
        logger.log(`[Reset Password] Password update error: ${error.message}`)
        setError(error.message)
        setUpdating(false)
        return
      }

      // If we get here, password was updated successfully
      logger.log('[Reset Password] Password updated successfully!')
      
      // Immediately show success state
      setUpdating(false)
      setSuccess(true)
      
      // Sign out and redirect after a short delay
      setTimeout(() => {
        supabase.auth.signOut().finally(() => {
          window.location.href = '/?reset=success'
        })
      }, 2000)
      
    } catch (err: any) {
      logger.log(`[Reset Password] Password update exception: ${err.message}`)
      clearTimeout(fallbackTimer)
      setError('Unable to update password. Please try again.')
      setUpdating(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <CheckCircle className="w-12 h-12 text-green-600" />
            <h2 className="text-xl font-semibold">Password Updated!</h2>
            <p className="text-muted-foreground">Redirecting to home...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !showForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-xl">✕</span>
            </div>
            <h2 className="text-xl font-semibold">Reset Link Issue</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button 
              onClick={() => router.push('/')}
              className="mt-4"
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!showForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Waiting for password reset verification...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            
            {/* Manual success option if stuck */}
            {updating && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Taking too long? You may have already updated your password. 
                <Button 
                  variant="link" 
                  className="p-0 h-auto font-normal underline"
                  onClick={() => {
                    window.location.href = '/?reset=success'
                  }}
                >
                  Click here to continue
                </Button>
              </p>
            )}
          </form>
          
        </CardContent>
      </Card>
    </div>
  )
}

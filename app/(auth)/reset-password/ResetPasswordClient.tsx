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
  const [debugLog, setDebugLog] = useState<string[]>([])

  const addDebug = (message: string) => {
    logger.log('[Reset Password]', message)
    setDebugLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    addDebug('Component mounted, setting up auth listener...')
    addDebug(`Full URL: ${window.location.href}`)
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const tokenHash = urlParams.get('token_hash')
    const type = urlParams.get('type')
    
    // If we have the expected token_hash and type=recovery, let Supabase handle it
    if (tokenHash && type === 'recovery') {
      addDebug('Found token_hash and type=recovery - standard password reset flow')
      
      // Listen for PASSWORD_RECOVERY event
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        addDebug(`Auth event: ${event}, Session: ${session ? 'present' : 'null'}`)
        
        if (event === "PASSWORD_RECOVERY") {
          addDebug('PASSWORD_RECOVERY event received! Showing form...')
          setShowForm(true)
        }
      })
      
      return () => subscription.unsubscribe()
    }
    
    // If we have a code parameter (non-standard format), handle it differently
    if (code) {
      addDebug('Found code parameter - non-standard format, checking for email link type...')
      
      // Try to verify this is a valid reset link by calling verifyOtp
      supabase.auth.verifyOtp({
        token_hash: code,
        type: 'recovery'
      }).then(({ data, error }) => {
        if (error) {
          addDebug(`OTP verification error: ${error.message}`)
          // If verification fails, still show the form as a fallback
          addDebug('Showing form as fallback...')
          setShowForm(true)
        } else {
          addDebug('OTP verified successfully, session should be established')
          setShowForm(true)
        }
      })
      
      return
    }
    
    // No recognized parameters
    addDebug('No password reset parameters found in URL')
    setError('Invalid password reset link. Please request a new one.')
  }, [])

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
    addDebug('Updating password...')

    try {
      // First check if we have a session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        addDebug('No session found - attempting direct password reset...')
        
        // Get the code from URL
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        
        if (code) {
          // Try using the code directly with a different approach
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: code,
            type: 'recovery',
            options: {
              redirectTo: window.location.origin
            }
          })
          
          if (!error && data.session) {
            addDebug('Session established via OTP verification, now updating password...')
            // Now try to update password with the new session
            const { error: updateError } = await supabase.auth.updateUser({
              password: password
            })
            
            if (updateError) {
              addDebug(`Password update error after OTP: ${updateError.message}`)
              setError(updateError.message)
            } else {
              addDebug('Password updated successfully!')
              setSuccess(true)
              setTimeout(() => {
                window.location.href = '/?reset=success'
              }, 2000)
            }
          } else {
            addDebug(`OTP verification failed: ${error?.message}`)
            setError('Invalid or expired reset link. Please request a new one.')
          }
        } else {
          setError('No reset code found. Please use the link from your email.')
        }
      } else {
        // We have a session, proceed normally
        addDebug('Session exists, updating password...')
        const { data, error } = await supabase.auth.updateUser({
          password: password
        })

        if (error) {
          addDebug(`Password update error: ${error.message}`)
          setError(error.message)
        } else {
          addDebug('Password updated successfully!')
          setSuccess(true)
          setTimeout(() => {
            supabase.auth.signOut().then(() => {
              window.location.href = '/?reset=success'
            })
          }, 2000)
        }
      }
    } catch (err: any) {
      addDebug(`Password update exception: ${err.message}`)
      setError('An unexpected error occurred')
    } finally {
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-600 text-xl">✕</span>
            </div>
            <h2 className="text-xl font-semibold text-red-600">Reset Link Issue</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button 
              onClick={() => router.push('/')}
              className="mt-4"
            >
              Request New Reset Link
            </Button>
            <div className="text-xs text-gray-400 mt-4 text-left">
              <div className="font-mono">Debug Log:</div>
              {debugLog.map((log, i) => (
                <div key={i} className="font-mono">{log}</div>
              ))}
            </div>
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
            <div className="text-xs text-gray-400 mt-4 text-left">
              <div className="font-mono">Debug Log:</div>
              {debugLog.map((log, i) => (
                <div key={i} className="font-mono">{log}</div>
              ))}
            </div>
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
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle } from 'lucide-react'

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
    console.log('[Reset Password]', message)
    setDebugLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    addDebug('Component mounted, checking URL and auth state...')
    
    const handleAuth = async () => {
      // Method 1: Check for PKCE code parameter (most common now)
      if (typeof window !== 'undefined') {
        const search = window.location.search
        addDebug(`URL search: ${search ? 'present' : 'none'}`)
        
        if (search) {
          const params = new URLSearchParams(search)
          const code = params.get('code')
          
          addDebug(`PKCE code: ${code ? 'present' : 'none'}`)
          
          if (code) {
            addDebug('Found PKCE code! Exchanging for session...')
            try {
              const { data, error } = await supabase.auth.exchangeCodeForSession(code)
              
              if (error) {
                addDebug(`Code exchange error: ${error.message}`)
                setError('Invalid or expired reset link. Please request a new password reset.')
                return
              }
              
              if (data.session) {
                addDebug('Successfully exchanged code for session!')
                setShowForm(true)
                return
              }
            } catch (err: any) {
              addDebug(`Code exchange exception: ${err.message}`)
              setError('Failed to process reset link. Please try again.')
              return
            }
          }
        }
      }
      
      // Method 2: Check current session
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          addDebug(`Session check error: ${error.message}`)
        } else if (session) {
          addDebug(`Found existing session, user: ${session.user?.email}`)
          setShowForm(true)
          return
        } else {
          addDebug('No existing session found')
        }
      } catch (err: any) {
        addDebug(`Session check exception: ${err.message}`)
      }

      // Method 3: Listen for auth state changes as fallback
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        addDebug(`Auth event: ${event}, Session: ${session ? 'present' : 'null'}`)
        
        if (event === "PASSWORD_RECOVERY") {
          addDebug('PASSWORD_RECOVERY event received! Showing form...')
          setShowForm(true)
        }
        
        if (event === "SIGNED_IN" && session) {
          addDebug('SIGNED_IN event with session')
          setShowForm(true)
        }
      })

      // Timeout fallback
      setTimeout(() => {
        if (!showForm) {
          addDebug('Timeout reached - no recovery detected. Showing error.')
          setError('Reset link expired or invalid. Please request a new password reset.')
        }
      }, 10000)

      return () => subscription.unsubscribe()
    }

    handleAuth()
  }, [showForm])

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
    addDebug('Attempting to update password...')

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        addDebug(`Password update error: ${error.message}`)
        setError(error.message)
      } else {
        addDebug('Password updated successfully!')
        setSuccess(true)
        setTimeout(async () => {
          await supabase.auth.signOut()
          router.push('/login?reset=success')
        }, 2000)
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
            <p className="text-muted-foreground">Redirecting to login...</p>
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
              onClick={() => router.push('/login')}
              className="mt-4"
            >
              Back to Login
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
            <p className="text-muted-foreground">Processing reset link...</p>
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

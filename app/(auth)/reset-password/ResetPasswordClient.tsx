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

  useEffect(() => {
    console.log('[ResetPassword] Component mounted, setting up auth listener...')
    
    // Simple listener for PASSWORD_RECOVERY event as per Supabase docs
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[ResetPassword] Auth event:', event, 'Session:', !!session)
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[ResetPassword] PASSWORD_RECOVERY event received! Showing form...')
        setShowForm(true)
      }
    })

    // Check for error in URL
    const url = new URL(window.location.href)
    const errorDesc = url.searchParams.get('error_description')
    if (errorDesc) {
      console.log('[ResetPassword] Error in URL:', errorDesc)
      setError(errorDesc)
      setShowForm(false)
    }

    return () => {
      console.log('[ResetPassword] Cleaning up auth listener')
      subscription.unsubscribe()
    }
  }, [])

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
  if (error && !showForm) {
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

  // Show loading state while waiting for PASSWORD_RECOVERY event
  if (!showForm) {
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
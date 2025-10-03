import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Skip middleware for auth-related routes to prevent interference
  const authRoutes = ['/reset-password', '/login', '/auth-loading', '/email-confirmed']
  const isAuthRoute = authRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  
  if (isAuthRoute) {
    // Don't process auth routes - let them handle their own auth state
    return res
  }
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })
  
  // Refresh session if expired - required for Server Components
  const { data: { session }, error } = await supabase.auth.getSession()
  
  // Forward the refreshed session to Server Components
  if (!error && session) {
    // Session is valid, continue
    return res
  }
  
  // Check if we're on a protected route
  const protectedRoutes = ['/dashboard', '/onboarding']
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  
  // If on a protected route without a session, redirect to home
  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/'
    redirectUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  return res
}

// Specify which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - reset-password (password reset flow)
     * - login (login page)
     * - auth-loading (auth loading page)
     * - email-confirmed (email confirmation page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|reset-password|login|auth-loading|email-confirmed|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

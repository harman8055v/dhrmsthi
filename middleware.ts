import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Skip middleware for now to avoid any interference with auth
  // This is temporary until we properly fix the auth flow
  return NextResponse.next()
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

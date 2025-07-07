import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareSupabaseClient } from "@supabase/auth-helpers-nextjs"
// If you have generated Supabase types, replace `any` below with your Database interface

// Configure which paths require authentication
const PROTECTED_PATHS = [
  "/dashboard",
  "/dashboard/matches",
  "/dashboard/messages",
  "/dashboard/preferences",
  "/dashboard/profile",
  "/dashboard/referrals",
  "/dashboard/settings",
  "/dashboard/store",
  // Root-level post-onboarding routes
  "/swipe",
  "/messages",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only run on protected paths
  if (!PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareSupabaseClient<any>({ req, res })

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not logged in → redirect to /login
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Fetch onboarding status
  const { data: profile } = await supabase
    .from("users")
    .select("is_onboarded")
    .eq("id", session.user.id)
    .single()

  // Gate swipe/messages until onboarding complete
  if (!profile?.is_onboarded && (pathname.startsWith("/swipe") || pathname.startsWith("/messages"))) {
    const dashUrl = new URL("/dashboard", req.url)
    return NextResponse.redirect(dashUrl)
  }

  return res
}

export const config = {
  matcher: [
    // Apply to all protected routes and onboarding
    "/dashboard/:path*",
    "/swipe/:path*",
    "/messages/:path*",
  ],
} 
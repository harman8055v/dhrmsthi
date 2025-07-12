import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient, User } from '@supabase/supabase-js'

// Lazily cached admin client – avoids creating a new connection on every request
let adminClient: SupabaseClient | null = null
const getAdminClient = () => {
  if (!adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!url || !serviceKey) {
      throw new Error('[withAuth] Missing Supabase env vars')
    }
    adminClient = createClient(url, serviceKey)
  }
  return adminClient
}

interface AuthContext {
  supabase: SupabaseClient
  user: User
}

/**
 * Wrap an API route with JWT verification using the bearer token in the
 * `Authorization` header.  On success, passes an admin Supabase client and the
 * authenticated `User` to the underlying handler.  Otherwise returns 401.
 */
export function withAuth(
  handler: (request: NextRequest, ctx: AuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const authHeader = request.headers.get('authorization') || ''
      const token = authHeader.replace(/Bearer\s+/i, '')

      if (!token) {
        return NextResponse.json({ error: 'Missing bearer token' }, { status: 401 })
      }

      const supabase = getAdminClient()
      const { data, error } = await supabase.auth.getUser(token)

      if (error || !data.user) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
      }

      return handler(request, { supabase, user: data.user })
    } catch (err) {
      console.error('[withAuth] Unexpected error:', err)
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
    }
  }
} 
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { logger } from "./logger"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  logger.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL / KEY – running in limited mode."
  )
}

// Create a single Supabase client instance with proper configuration
// This is the ONLY Supabase client that should be used throughout the app
export const supabase = createClientComponentClient({
  supabaseUrl,
  supabaseKey: supabaseAnonKey,
  options: {
    auth: {
      // Enable auto-refresh for better session management
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Storage key for auth persistence
      storageKey: 'dharmasaathi-auth',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-client-info': 'dharmasaathi-web'
      }
    }
  }
})

// Export as default for compatibility with existing imports
export default supabase

// Test real-time connection on client initialization
if (process.env.NODE_ENV === 'development') {
  // Test real-time status
  setTimeout(() => {
    const testChannel = supabase.channel('test-connection')
    testChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        testChannel.unsubscribe()
      } else if (status === 'CHANNEL_ERROR') {
        testChannel.unsubscribe()
      }
    })
  }, 1000)
}

// Log successful initialization (only in development)
if (process.env.NODE_ENV === 'development') {
  logger.log('Supabase client initialized successfully')
}

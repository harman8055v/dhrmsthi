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

// Create Supabase client with explicit configuration for real-time
export const supabase = createClientComponentClient({
  supabaseUrl,
  supabaseKey: supabaseAnonKey,
  options: {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    db: {
      schema: 'public'
    }
  }
})

// Test real-time connection on client initialization (browser only)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
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

// Log successful initialization (only in development, browser only)
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  logger.log('Supabase client initialized successfully')
}

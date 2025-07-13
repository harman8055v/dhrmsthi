import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL / KEY – running in limited mode."
  )
}

// Create Supabase client with explicit configuration
export const supabase = createClientComponentClient({
  supabaseUrl,
  supabaseKey: supabaseAnonKey,
})

// Log successful initialization (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase client initialized successfully')
}

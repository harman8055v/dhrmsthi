import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'SET' : 'MISSING',
    key: supabaseAnonKey ? 'SET' : 'MISSING'
  })
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
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

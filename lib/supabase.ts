import { createClient } from "@supabase/supabase-js"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL / KEY – running in limited mode."
  )
}

// Create Supabase client with PKCE flow for reliable email links on mobile
export const supabase = createClient(
  supabaseUrl || "",
  supabaseAnonKey || "",
  {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

// Log successful initialization (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase client initialized successfully')
}

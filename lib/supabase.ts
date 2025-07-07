import { createClient } from "@supabase/supabase-js"

// ---------------------------------------------------------------------------------------
//  Demo-friendly Supabase initialisation
//  • In normal deployments we still expect the real env vars to be present
//  • During local/demo mode we fall back to a dummy project so that importing
//    the supabase client doesn't immediately throw and break the UI.
// ---------------------------------------------------------------------------------------

const FALLBACK_SUPABASE_URL = "https://demo.supabase.co"
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkZW1vLWtleSIsImlhdCI6MTYyNjY2NjY2NiwiZXhwIjoyNTM4Nzg0NjY2LCJpc3MiOiJzdXBhYmFzZSIsInN1YiI6ImRlbW8tbW9kZSIsInJvbGUiOiJhbm9uIn0.0000000000000000000000000000000000000000000"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL / KEY – running in fallback demo mode",
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'dharmasaathi-auth',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }
})

if (process.env.NODE_ENV === "development") {
  console.log("Supabase client initialised (url:", supabaseUrl, ")")
}

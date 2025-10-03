// Re-export the main Supabase client to ensure we use a single instance
// This prevents multiple client instances and session sync issues
export { supabase, default } from './supabase'

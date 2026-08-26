// Compatibility entry point for Vite pages that need the browser client.
// Next.js server/cookie helpers are intentionally not used in this SPA.
import { getCurrentUser, isAuthProviderEnabled, refreshSupabaseSession, supabase } from './supabase'

export function createClient() {
  return supabase
}

export { getCurrentUser, isAuthProviderEnabled, refreshSupabaseSession, supabase }

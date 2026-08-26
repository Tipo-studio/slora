import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL)?.trim()
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ?? import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ?? import.meta.env.VITE_SUPABASE_ANON_KEY
  ?? import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim()

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables.')
}

try {
  new URL(supabaseUrl)
} catch {
  throw new Error('Invalid Supabase URL.')
}

// Vite is a browser-only app, so the browser client is the correct equivalent
// of the Next.js createBrowserClient helper. It persists and refreshes sessions
// automatically; a server cookie middleware must not be added to this app.
export const supabase: SupabaseClient = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    persistSession: true,
  },
})

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user
}

export async function refreshSupabaseSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function isAuthProviderEnabled(provider: string) {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabasePublishableKey },
    })
    if (!response.ok) return null

    const settings = await response.json() as { external?: Record<string, boolean> }
    return settings.external?.[provider] ?? null
  } catch {
    return null
  }
}

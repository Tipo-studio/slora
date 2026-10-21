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

type AuthSettings = { external?: Record<string, boolean> }

const AUTH_SETTINGS_CACHE_TTL_MS = 5 * 60_000
let authSettingsCache: { value: AuthSettings; expiresAt: number } | null = null
let pendingAuthSettingsRequest: Promise<AuthSettings | null> | null = null

function getAuthSettings() {
  if (authSettingsCache && authSettingsCache.expiresAt > Date.now()) {
    return Promise.resolve(authSettingsCache.value)
  }
  authSettingsCache = null
  if (pendingAuthSettingsRequest) return pendingAuthSettingsRequest

  const settingsRequest = fetch(`${supabaseUrl}/auth/v1/settings`, {
    headers: { apikey: supabasePublishableKey },
  })
    .then(async (response) => {
      if (!response.ok) return null
      const settings = await response.json() as AuthSettings
      authSettingsCache = { value: settings, expiresAt: Date.now() + AUTH_SETTINGS_CACHE_TTL_MS }
      return settings
    })
    .catch(() => null)

  const sharedRequest = settingsRequest.finally(() => {
    if (pendingAuthSettingsRequest === sharedRequest) pendingAuthSettingsRequest = null
  })
  pendingAuthSettingsRequest = sharedRequest
  return sharedRequest
}

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
  const settings = await getAuthSettings()
  return settings?.external?.[provider] ?? null
}

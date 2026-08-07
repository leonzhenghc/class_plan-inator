import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * False until `.env` carries both values. Everything auth-related checks this
 * first so a fresh clone renders a "finish setup" screen instead of throwing on
 * import and white-screening the whole app.
 */
export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes('your-project-ref'))

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/** Turns Supabase's terser errors into something worth showing a person. */
export function friendlyAuthError(error) {
  if (!error) return null
  const message = error.message ?? String(error)

  if (/invalid login credentials/i.test(message)) return 'That email and password do not match.'
  if (/email not confirmed/i.test(message)) {
    return 'Check your inbox and confirm your email address first.'
  }
  if (/user already registered/i.test(message)) {
    return 'An account with that email already exists — try signing in.'
  }
  if (/password should be at least/i.test(message)) {
    return 'Password must be at least 6 characters.'
  }
  if (/provider is not enabled/i.test(message)) {
    return 'Google sign-in is not enabled on this Supabase project yet.'
  }
  if (/rate limit|too many/i.test(message)) return 'Too many attempts — wait a moment and retry.'
  return message
}

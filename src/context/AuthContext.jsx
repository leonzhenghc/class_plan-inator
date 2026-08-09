import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

/**
 * Owns the Supabase session plus the current user's profile and preference rows.
 *
 * `loading` stays true until the very first session check resolves, so route
 * guards never flash the sign-in screen at someone who is already logged in.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  /**
   * Distinguishes "profile not fetched yet" from "fetched, and there is no row".
   * Without this the guard can't tell a mid-flight sign-up from a finished one,
   * and briefly renders the app to someone who still owes us onboarding.
   */
  const [profileLoaded, setProfileLoaded] = useState(false)

  const user = session?.user ?? null

  const loadUserRows = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      setPreferences(null)
      setProfileLoaded(false)
      return
    }

    const [profileResult, preferencesResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('preferences').select('*').eq('user_id', userId).maybeSingle(),
    ])

    setProfile(profileResult.data ?? null)
    setPreferences(preferencesResult.data ?? null)
    setProfileLoaded(true)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadUserRows(data.session?.user?.id)
      if (active) setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      await loadUserRows(nextSession?.user?.id)
      if (active) setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadUserRows])

  const signUp = useCallback(async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName ?? '' },
        emailRedirectTo: `${window.location.origin}/confirm-email`,
      },
    })
    return { data, error }
  }, [])

  /** Sends the "set a new password" email. Always resolves — see ForgotPassword. */
  const requestPasswordReset = useCallback(async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }, [])

  /** Only valid while the recovery link's session is active. */
  const updatePassword = useCallback(async (password) => {
    const { data, error } = await supabase.auth.updateUser({ password })
    return { data, error }
  }, [])

  const resendConfirmation = useCallback(async (email) => {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/confirm-email` },
    })
    return { data, error }
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
    return { data, error }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setProfile(null)
      setPreferences(null)
      setProfileLoaded(false)
    }
    return { error }
  }, [])

  // Upsert rather than update: the sign-up trigger normally creates these rows,
  // but upserting means a missing row heals itself instead of failing the save.
  const updateProfile = useCallback(
    async (patch) => {
      if (!user) return { error: new Error('Not signed in') }
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...patch }, { onConflict: 'id' })
        .select()
        .single()
      if (!error) {
        setProfile(data)
        setProfileLoaded(true)
      }
      return { data, error }
    },
    [user],
  )

  const updatePreferences = useCallback(
    async (patch) => {
      if (!user) return { error: new Error('Not signed in') }
      const { data, error } = await supabase
        .from('preferences')
        .upsert({ user_id: user.id, ...patch }, { onConflict: 'user_id' })
        .select()
        .single()
      if (!error) setPreferences(data)
      return { data, error }
    },
    [user],
  )

  const refresh = useCallback(() => loadUserRows(user?.id), [loadUserRows, user])

  const value = useMemo(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      user,
      profile,
      preferences,
      profileLoaded,
      /**
       * Onboarding is complete once the profile carries a timestamp. A signed-in
       * user whose profile row is missing entirely also counts as needing it, so
       * accounts created before the trigger existed still get set up rather than
       * landing in a half-configured app.
       */
      needsOnboarding: Boolean(user) && profileLoaded && !profile?.onboarded_at,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      requestPasswordReset,
      updatePassword,
      resendConfirmation,
      updateProfile,
      updatePreferences,
      refresh,
    }),
    [
      loading,
      session,
      user,
      profile,
      preferences,
      profileLoaded,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      requestPasswordReset,
      updatePassword,
      resendConfirmation,
      updateProfile,
      updatePreferences,
      refresh,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

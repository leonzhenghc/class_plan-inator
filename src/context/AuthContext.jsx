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

  const user = session?.user ?? null

  const loadUserRows = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      setPreferences(null)
      return
    }

    const [profileResult, preferencesResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('preferences').select('*').eq('user_id', userId).maybeSingle(),
    ])

    setProfile(profileResult.data ?? null)
    setPreferences(preferencesResult.data ?? null)
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
      options: { data: { full_name: fullName ?? '' } },
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
    }
    return { error }
  }, [])

  const updateProfile = useCallback(
    async (patch) => {
      if (!user) return { error: new Error('Not signed in') }
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', user.id)
        .select()
        .single()
      if (!error) setProfile(data)
      return { data, error }
    },
    [user],
  )

  const updatePreferences = useCallback(
    async (patch) => {
      if (!user) return { error: new Error('Not signed in') }
      const { data, error } = await supabase
        .from('preferences')
        .update(patch)
        .eq('user_id', user.id)
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
      /** Onboarding is complete once the profile carries a timestamp. */
      needsOnboarding: Boolean(user) && Boolean(profile) && !profile.onboarded_at,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
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
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
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

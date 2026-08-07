import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AlertCircle, Loader2, MailCheck } from 'lucide-react'
import AuthShell, { AuthField } from '../components/auth/AuthShell.jsx'
import Button from '../components/ui/Button.jsx'
import GoogleMark from '../components/auth/GoogleMark.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { friendlyAuthError } from '../lib/supabase.js'

export default function SignIn() {
  const { user, loading, signIn, signUp, signInWithGoogle, resendConfirmation } = useAuth()
  const location = useLocation()

  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  /** Set when sign-up succeeded but the project requires email confirmation. */
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const [resent, setResent] = useState(false)

  const isSignUp = mode === 'signup'

  if (!loading && user) {
    return <Navigate to={location.state?.from ?? '/dashboard'} replace />
  }

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setError(null)
    setBusy(true)

    const action = isSignUp ? signUp : signIn
    const { data, error: authError } = await action(form)

    setBusy(false)

    if (authError) {
      setError(friendlyAuthError(authError))
      return
    }

    // With confirmation on, sign-up returns a user but no session.
    if (isSignUp && !data?.session) setAwaitingConfirmation(true)
  }

  const withGoogle = async () => {
    setError(null)
    setBusy(true)
    const { error: oauthError } = await signInWithGoogle()
    if (oauthError) {
      setError(friendlyAuthError(oauthError))
      setBusy(false)
    }
    // On success the browser leaves for Google, so there is nothing to reset.
  }

  const resend = async () => {
    setBusy(true)
    setError(null)
    const { error: resendError } = await resendConfirmation(form.email)
    setBusy(false)
    if (resendError) {
      setError(friendlyAuthError(resendError))
      return
    }
    setResent(true)
  }

  if (awaitingConfirmation) {
    return (
      <AuthShell
        title="Confirm your email"
        subtitle="One click and your workspace is ready."
        footer={
          <button
            type="button"
            onClick={() => {
              setAwaitingConfirmation(false)
              setMode('signin')
              setResent(false)
            }}
            className="cursor-pointer font-semibold text-brand-600 hover:text-brand-700"
          >
            Back to sign in
          </button>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <MailCheck className="h-6 w-6 text-emerald-600" strokeWidth={2} />
          </span>
          <p className="text-[15px] leading-relaxed text-gray-600">
            We sent a link to <span className="font-semibold text-gray-900">{form.email}</span>.
            Open it to finish setting up — check spam if it hasn&apos;t arrived.
          </p>

          {error ? (
            <p
              role="alert"
              className="w-full rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600"
            >
              {error}
            </p>
          ) : null}

          {resent ? (
            <p className="text-[15px] font-semibold text-emerald-600">Sent again.</p>
          ) : (
            <button
              type="button"
              onClick={resend}
              disabled={busy}
              className="cursor-pointer text-[15px] font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-60"
            >
              Resend the email
            </button>
          )}
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={isSignUp ? 'Create your workspace' : 'Welcome back'}
      subtitle={
        isSignUp
          ? 'One place for your classes, assignments and focus time.'
          : 'Sign in to pick up where you left off.'
      }
      footer={
        <>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(isSignUp ? 'signin' : 'signup')
              setError(null)
            }}
            className="cursor-pointer font-semibold text-brand-600 hover:text-brand-700"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </>
      }
    >
      <button
        type="button"
        onClick={withGoogle}
        disabled={busy}
        className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-gray-200 text-[15px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleMark className="h-5 w-5" />
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-gray-200" />
        <span className="text-[13px] font-medium text-gray-400">or</span>
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        {isSignUp ? (
          <AuthField
            id="fullName"
            label="Full name"
            value={form.fullName}
            onChange={update('fullName')}
            autoComplete="name"
            required
          />
        ) : null}

        <AuthField
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={update('email')}
          autoComplete="email"
          required
        />

        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <label htmlFor="password" className="text-[13px] font-medium text-gray-600">
              Password
            </label>
            {isSignUp ? null : (
              <Link
                to="/forgot-password"
                className="text-[13px] font-semibold text-brand-600 hover:text-brand-700"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={update('password')}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            required
            className="h-12 w-full rounded-xl border border-gray-200 px-4 text-[15px] text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          />
          {isSignUp ? (
            <p className="mt-1.5 text-[13px] text-gray-400">At least 8 characters</p>
          ) : null}
        </div>

        {error ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600"
          >
            <AlertCircle className="mt-px h-4 w-4 shrink-0" strokeWidth={2.25} />
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : null}
          {isSignUp ? 'Create account' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  )
}

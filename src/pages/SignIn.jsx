import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AlertCircle, Copy, Loader2, Mail } from 'lucide-react'
import Button from '../components/ui/Button.jsx'
import { cn } from '../components/ui/cn.js'
import { useAuth } from '../context/AuthContext.jsx'
import { friendlyAuthError } from '../lib/supabase.js'
import GoogleMark from '../components/auth/GoogleMark.jsx'

export default function SignIn() {
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth()
  const location = useLocation()

  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)

  const isSignUp = mode === 'signup'

  if (!loading && user) {
    return <Navigate to={location.state?.from ?? '/dashboard'} replace />
  }

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)

    const action = isSignUp ? signUp : signIn
    const { data, error: authError } = await action(form)

    setBusy(false)

    if (authError) {
      setError(friendlyAuthError(authError))
      return
    }

    // Projects with email confirmation on return a user but no session.
    if (isSignUp && !data?.session) {
      setNotice('Check your inbox to confirm your email, then sign in.')
      setMode('signin')
    }
  }

  const withGoogle = async () => {
    setError(null)
    setBusy(true)
    const { error: oauthError } = await signInWithGoogle()
    if (oauthError) {
      setError(friendlyAuthError(oauthError))
      setBusy(false)
    }
    // On success the browser navigates away to Google, so nothing to do here.
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
            <Copy className="h-6 w-6 text-white" strokeWidth={2.25} />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">
            {isSignUp ? 'Create your workspace' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-[15px] text-gray-500">
            {isSignUp
              ? 'One place for your classes, assignments and focus time.'
              : 'Sign in to pick up where you left off.'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
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
              <Field
                id="fullName"
                label="Full name"
                value={form.fullName}
                onChange={update('fullName')}
                autoComplete="name"
                required
              />
            ) : null}

            <Field
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
              required
            />

            <Field
              id="password"
              label="Password"
              type="password"
              value={form.password}
              onChange={update('password')}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              hint={isSignUp ? 'At least 6 characters' : undefined}
              required
            />

            {error ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600"
              >
                <AlertCircle className="mt-px h-4 w-4 shrink-0" strokeWidth={2.25} />
                {error}
              </p>
            ) : null}

            {notice ? (
              <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700">
                <Mail className="mt-px h-4 w-4 shrink-0" strokeWidth={2.25} />
                {notice}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : null}
              {isSignUp ? 'Create account' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[15px] text-gray-500">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(isSignUp ? 'signin' : 'signup')
              setError(null)
              setNotice(null)
            }}
            className="cursor-pointer font-semibold text-brand-600 hover:text-brand-700"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>
    </div>
  )
}

function Field({ id, label, hint, className, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-gray-600">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className={cn(
          'h-12 w-full rounded-xl border border-gray-200 px-4 text-[15px] text-gray-800',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none',
          className,
        )}
        {...props}
      />
      {hint ? <p className="mt-1.5 text-[13px] text-gray-400">{hint}</p> : null}
    </div>
  )
}

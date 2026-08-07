import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import AuthShell, { AuthField, readCallbackError } from '../components/auth/AuthShell.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { friendlyAuthError } from '../lib/supabase.js'

const MIN_LENGTH = 8

/**
 * Landing page for the emailed recovery link. Supabase turns that link into a
 * short-lived session before we get here, so a signed-in user is the signal
 * that the link was good.
 *
 * The token is NOT stripped from the URL here. Run before the auth client has
 * consumed it, a manual replaceState would race GoTrue's `detectSessionInUrl`
 * and destroy the very token that creates the session. GoTrue clears the hash
 * itself once it has read it.
 */
export default function ResetPassword() {
  const { loading, user, updatePassword } = useAuth()
  const navigate = useNavigate()

  const [linkError] = useState(() => readCallbackError())
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const submit = async (event) => {
    event.preventDefault()

    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('Those two passwords do not match.')
      return
    }

    setBusy(true)
    setError(null)
    const { error: updateError } = await updatePassword(password)
    setBusy(false)

    if (updateError) {
      setError(friendlyAuthError(updateError))
      return
    }
    setDone(true)
  }

  if (loading) {
    return (
      <AuthShell title="One moment">
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell title="Password updated" subtitle="You're signed in and ready to go.">
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" strokeWidth={2} />
          </span>
          <Button size="lg" className="w-full" onClick={() => navigate('/dashboard', { replace: true })}>
            Continue to Clarity
          </Button>
        </div>
      </AuthShell>
    )
  }

  // No session means the link was bad, already used, or expired.
  if (!user) {
    return (
      <AuthShell
        title="That link didn't work"
        subtitle={linkError ?? 'Reset links are single-use and expire within the hour.'}
        footer={
          <Link to="/signin" className="font-semibold text-brand-600 hover:text-brand-700">
            Back to sign in
          </Link>
        }
      >
        <Button as={Link} to="/forgot-password" size="lg" className="w-full">
          Request a new link
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Choose a new password" subtitle={user.email}>
      <form onSubmit={submit} className="space-y-4">
        <AuthField
          id="password"
          label="New password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          hint={`At least ${MIN_LENGTH} characters`}
          required
          autoFocus
        />

        <AuthField
          id="confirm"
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
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

        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : null}
          Update password
        </Button>
      </form>
    </AuthShell>
  )
}

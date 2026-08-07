import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from 'lucide-react'
import AuthShell, { AuthField, readCallbackError } from '../components/auth/AuthShell.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { friendlyAuthError } from '../lib/supabase.js'

/**
 * Where the confirmation email lands. Supabase verifies the token and signs the
 * user in before redirecting here, so an active session means it worked.
 */
export default function ConfirmEmail() {
  const { loading, user, resendConfirmation } = useAuth()
  const navigate = useNavigate()

  const [linkError] = useState(() => readCallbackError())
  const [email, setEmail] = useState('')
  const [resent, setResent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (window.location.hash || window.location.search) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const resend = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const { error: resendError } = await resendConfirmation(email.trim())
    setBusy(false)
    if (resendError) {
      setError(friendlyAuthError(resendError))
      return
    }
    setResent(true)
  }

  if (loading) {
    return (
      <AuthShell title="Confirming your email">
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      </AuthShell>
    )
  }

  if (user && !linkError) {
    return (
      <AuthShell
        title="Email confirmed"
        subtitle="Your account is verified and you're signed in."
      >
        <div className="flex flex-col items-center gap-5 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" strokeWidth={2} />
          </span>
          <p className="text-[15px] leading-relaxed text-gray-600">
            <span className="font-semibold text-gray-900">{user.email}</span> is confirmed.
          </p>
          <Button size="lg" className="w-full" onClick={() => navigate('/dashboard', { replace: true })}>
            Continue
          </Button>
        </div>
      </AuthShell>
    )
  }

  if (resent) {
    return (
      <AuthShell
        title="Confirmation sent"
        subtitle="Check your inbox for a fresh link."
        footer={
          <Link to="/signin" className="font-semibold text-brand-600 hover:text-brand-700">
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <MailCheck className="h-6 w-6 text-emerald-600" strokeWidth={2} />
          </span>
          <p className="text-[15px] leading-relaxed text-gray-600">
            Sent to <span className="font-semibold text-gray-900">{email}</span>. Remember to look
            in spam if it doesn&apos;t arrive.
          </p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="We couldn't confirm that"
      subtitle={linkError ?? 'Confirmation links are single-use and expire.'}
      footer={
        <Link to="/signin" className="font-semibold text-brand-600 hover:text-brand-700">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={resend} className="space-y-4">
        <p className="text-[15px] leading-relaxed text-gray-600">
          Enter your email and we&apos;ll send a new confirmation link.
        </p>

        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
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
          Resend confirmation
        </Button>
      </form>
    </AuthShell>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Loader2, MailCheck } from 'lucide-react'
import AuthShell, { AuthField } from '../components/auth/AuthShell.jsx'
import Button from '../components/ui/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { friendlyAuthError } from '../lib/supabase.js'

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError(null)

    const { error: resetError } = await requestPasswordReset(email.trim())
    setBusy(false)

    // Supabase answers unknown addresses with success, so it never leaks who has
    // an account. Anything it does report back is about the request itself — a
    // malformed address, a cooldown — and the user can act on it, so show it.
    if (resetError) {
      setError(friendlyAuthError(resetError))
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="If an account exists for that address, a reset link is on its way."
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
            We sent instructions to <span className="font-semibold text-gray-900">{email}</span>.
            The link is single-use and expires within the hour.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="cursor-pointer text-[15px] font-semibold text-brand-600 hover:text-brand-700"
          >
            Use a different address
          </button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to choose a new one."
      footer={
        <Link
          to="/signin"
          className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          autoFocus
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
          Send reset link
        </Button>
      </form>
    </AuthShell>
  )
}

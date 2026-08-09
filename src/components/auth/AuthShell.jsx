import { Copy } from 'lucide-react'
import { cn } from '../ui/cn.js'

/** Shared frame for sign-in, sign-up, reset and confirmation screens. */
export default function AuthShell({ title, subtitle, children, footer, className }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className={cn('w-full max-w-[420px]', className)}>
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
            <Copy className="h-6 w-6 text-white" strokeWidth={2.25} />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">{title}</h1>
          {subtitle ? <p className="mt-2 text-[15px] text-gray-500">{subtitle}</p> : null}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          {children}
        </div>

        {footer ? <div className="mt-6 text-center text-[15px] text-gray-500">{footer}</div> : null}
      </div>
    </div>
  )
}

export function AuthField({ id, label, hint, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-gray-600">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="h-12 w-full rounded-xl border border-gray-200 px-4 text-[15px] text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
        {...props}
      />
      {hint ? <p className="mt-1.5 text-[13px] text-gray-400">{hint}</p> : null}
    </div>
  )
}

/**
 * Supabase reports callback failures either in the hash (implicit flow) or the
 * query string (PKCE), so check both before deciding a link was fine.
 */
export function readCallbackError() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  const code = hash.get('error') ?? query.get('error')
  if (!code) return null

  const description = hash.get('error_description') ?? query.get('error_description') ?? ''
  if (/expired/i.test(description) || /expired/i.test(code)) {
    return 'That link has expired. Request a new one below.'
  }
  if (/already/i.test(description)) return 'That link has already been used.'
  return description.replace(/\+/g, ' ') || 'That link is not valid any more.'
}

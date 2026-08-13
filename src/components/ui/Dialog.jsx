import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from './cn.js'

/**
 * Modal shell: backdrop, escape-to-close, focus on open, scrollable body with a
 * pinned footer. Render a <form> around it when the content submits.
 */
export default function Dialog({ open, onClose, title, description, footer, children, className }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    panelRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Close dialog"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-gray-900/40 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[88vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl focus:outline-none',
          className,
        )}
      >
        <div className="px-7 pt-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-ml-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-ink-4 transition-colors hover:bg-surface-2 hover:text-ink-2"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </button>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">{title}</h2>
          {description ? <p className="mt-1 text-[15px] text-ink-3">{description}</p> : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 pb-2">{children}</div>

        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-line px-7 py-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function Field({ id, label, hint, children, className }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-[13px] font-medium text-ink-2">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-[13px] text-ink-4">{hint}</p> : null}
    </div>
  )
}

export const inputClass =
  'h-12 w-full rounded-xl border border-line px-4 text-[15px] text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none'

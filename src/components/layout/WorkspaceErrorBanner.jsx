import { useState } from 'react'
import { AlertTriangle, RotateCcw, X } from 'lucide-react'
import { useWorkspace } from '../../context/WorkspaceContext.jsx'

/**
 * Shows when a workspace fetch failed. Without this the whole app silently
 * renders empty data and there is no way to tell the difference between "no
 * rows" and "could not load". Retry re-runs the fetch; the banner hides until
 * a different error arrives or the load succeeds (error resets to null).
 */
export default function WorkspaceErrorBanner() {
  const { error, reload } = useWorkspace()
  const [dismissed, setDismissed] = useState(null)

  if (!error || dismissed === error.message) return null

  return (
    <div
      role="alert"
      className="mx-8 mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/40 dark:bg-red-500/10"
    >
      <AlertTriangle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-red-600 dark:text-red-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-red-700 dark:text-red-300">
          Could not load your workspace
        </p>
        <p className="mt-0.5 break-words text-[13px] leading-relaxed text-red-600 dark:text-red-400">
          {typeof error === 'string' ? error : error?.message ?? 'Something went wrong.'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={reload}
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-red-600 px-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
          Retry
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => setDismissed(error.message)}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
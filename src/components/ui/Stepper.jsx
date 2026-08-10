import { Minus, Plus } from 'lucide-react'
import { cn } from './cn.js'

/**
 * `onChange` must be a state setter — it is called with an updater function so that rapid
 * clicks compose off the latest value instead of the one captured at render.
 */
export default function Stepper({
  label,
  hint,
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  unit,
  className,
}) {
  const nudge = (delta) =>
    onChange((current) => Math.min(max, Math.max(min, current + delta)))

  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-[15px] font-semibold text-ink">{label}</span>
        {hint ? <span className="text-[13px] text-ink-4">{hint}</span> : null}
      </div>

      <div className="flex items-center justify-between gap-2 rounded-xl border border-line p-1.5">
        <button
          type="button"
          onClick={() => nudge(-step)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-surface-2 text-ink-2 transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-4 w-4" strokeWidth={2.5} />
        </button>

        <span className="flex items-baseline gap-1 tabular-nums">
          <span className="text-xl font-bold text-ink">{value}</span>
          {unit ? <span className="text-[13px] font-medium text-ink-3">{unit}</span> : null}
        </span>

        <button
          type="button"
          onClick={() => nudge(step)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-surface-2 text-ink-2 transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

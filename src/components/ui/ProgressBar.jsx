import { cn } from './cn.js'

export default function ProgressBar({ value = 0, max = 100, className, barClassName }) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-line', className)}
    >
      <div
        className={cn('h-full rounded-full bg-brand-600 transition-[width]', barClassName)}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

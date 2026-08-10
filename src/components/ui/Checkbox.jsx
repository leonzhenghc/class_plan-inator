import { Check } from 'lucide-react'
import { cn } from './cn.js'

export default function Checkbox({ checked, onChange, className, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 transition-colors',
        'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none',
        checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-surface',
        className,
      )}
    >
      {checked ? <Check className="h-4 w-4" strokeWidth={3.5} /> : null}
    </button>
  )
}

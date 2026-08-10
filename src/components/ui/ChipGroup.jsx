import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from './cn.js'

/**
 * Multi-select tag picker. Suggestions are one tap; `allowCustom` adds a field
 * for anything the list misses, so the data stays open-ended without forcing
 * everyone to type.
 *
 * `onChange` is called with an updater, not a value, so two taps landing in the
 * same tick compose instead of the second overwriting the first.
 */
export default function ChipGroup({
  label,
  hint,
  options,
  value = [],
  onChange,
  allowCustom = false,
  placeholder = 'Add your own',
}) {
  const [draft, setDraft] = useState('')

  const toggle = (item) =>
    onChange((current = []) =>
      current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item],
    )

  const addCustom = (event) => {
    event.preventDefault()
    const entry = draft.trim()
    if (!entry) return
    setDraft('')
    onChange((current = []) =>
      // Case-insensitive match so "Chess" doesn't sit next to "chess".
      current.some((existing) => existing.toLowerCase() === entry.toLowerCase())
        ? current
        : [...current, entry],
    )
  }

  // Anything chosen that isn't a suggestion, so custom entries stay visible.
  const extras = value.filter((entry) => !options.includes(entry))

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-semibold text-ink">{label}</span>
        {hint ? <span className="text-[13px] text-ink-4">{hint}</span> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((item) => {
          const selected = value.includes(item)
          return (
            <button
              key={item}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(item)}
              className={cn(
                'cursor-pointer rounded-full border px-3.5 py-2 text-[14px] font-medium transition-colors',
                selected
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-line bg-surface text-ink-2 hover:border-line hover:bg-surface-2',
              )}
            >
              {item}
            </button>
          )
        })}

        {extras.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 rounded-full border border-brand-600 bg-brand-600 px-3.5 py-2 text-[14px] font-medium text-white"
          >
            {item}
            <button
              type="button"
              onClick={() => toggle(item)}
              aria-label={`Remove ${item}`}
              className="cursor-pointer rounded-full text-white/70 transition-colors hover:text-white"
            >
              <X className="h-3.5 w-3.5" strokeWidth={3} />
            </button>
          </span>
        ))}
      </div>

      {allowCustom ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter would otherwise submit the surrounding wizard form.
              if (event.key === 'Enter') addCustom(event)
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-11 min-w-0 flex-1 rounded-xl border border-line px-4 text-[15px] text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          />
          <button
            type="button"
            onClick={addCustom}
            aria-label="Add"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-surface-2 text-ink-2 transition-colors hover:bg-line"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      ) : null}
    </div>
  )
}

import { cn } from './cn.js'

export default function SegmentedControl({
  options,
  value,
  onChange,
  className,
  size = 'md',
  activeClassName = 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200',
}) {
  const sizes = {
    sm: 'h-9 px-4 text-[13px]',
    md: 'h-11 px-8 text-[15px]',
  }

  return (
    <div className={cn('inline-flex items-center gap-1 rounded-xl bg-gray-100 p-1', className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange?.(option.value)}
            className={cn(
              'cursor-pointer rounded-lg font-semibold transition-colors',
              sizes[size],
              active ? activeClassName : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

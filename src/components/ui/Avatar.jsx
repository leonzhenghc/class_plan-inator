import { cn } from './cn.js'

export default function Avatar({
  name = 'Alex Johnson',
  shape = 'rounded-full',
  className,
  textClassName,
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center bg-gradient-to-br from-brand-400 to-brand-700 font-bold text-white select-none',
        shape,
        className,
      )}
      title={name}
    >
      <span className={cn('text-xs', textClassName)}>{initials}</span>
    </div>
  )
}

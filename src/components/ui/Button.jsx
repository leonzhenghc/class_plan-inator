import { cn } from './cn.js'

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  soft: 'bg-brand-500 text-white hover:bg-brand-600',
  outline: 'border border-line bg-surface text-ink-2 hover:bg-surface-2',
  outlineBrand: 'border border-brand-200 dark:border-brand-500/30 bg-surface text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/15',
  ghost: 'bg-surface-2 text-ink-2 hover:bg-line',
  white: 'bg-surface text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/15 shadow-sm',
}

const SIZES = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
}

export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cn(
        'inline-flex cursor-pointer items-center justify-center font-semibold transition-colors',
        'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {Icon ? <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} /> : null}
      {children}
      {IconRight ? <IconRight className="h-[18px] w-[18px]" strokeWidth={2.25} /> : null}
    </Tag>
  )
}

export function IconButton({ icon: Icon, className, label, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink-2',
        className,
      )}
      {...props}
    >
      <Icon className="h-5 w-5" strokeWidth={2} />
    </button>
  )
}

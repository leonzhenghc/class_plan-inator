import { cn } from './cn.js'

export default function Card({ as: Tag = 'div', className, children, ...props }) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function CardTitle({ icon: Icon, children, className, action }) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-[18px] w-[18px] text-brand-600" strokeWidth={2} /> : null}
        <h2 className="text-[13px] font-bold tracking-[0.08em] text-ink uppercase">
          {children}
        </h2>
      </div>
      {action}
    </div>
  )
}

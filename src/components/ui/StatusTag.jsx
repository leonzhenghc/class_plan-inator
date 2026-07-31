import { cn } from './cn.js'

const TONES = {
  due: 'bg-red-100 text-red-600',
  progress: 'bg-emerald-100 text-emerald-700',
  todo: 'bg-gray-100 text-gray-500',
  done: 'bg-emerald-100 text-emerald-700',
  info: 'bg-blue-100 text-blue-700',
  stem: 'bg-emerald-100 text-emerald-700',
  humanities: 'bg-blue-100 text-blue-700',
  arts: 'bg-violet-100 text-violet-700',
  social: 'bg-sky-100 text-sky-700',
  focus: 'bg-white/70 text-slate-700',
  brand: 'bg-brand-100 text-brand-700',
}

export default function StatusTag({ tone = 'todo', caps = true, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap',
        caps ? 'tracking-[0.06em] uppercase' : 'text-[12px]',
        TONES[tone] ?? TONES.todo,
        className,
      )}
    >
      {children}
    </span>
  )
}

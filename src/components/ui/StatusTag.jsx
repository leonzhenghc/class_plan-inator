import { cn } from './cn.js'

const TONES = {
  due: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
  progress: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  todo: 'bg-surface-2 text-ink-3',
  done: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  info: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
  stem: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  humanities: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
  arts: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300',
  social: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300',
  focus: 'bg-surface/70 text-ink-2',
  brand: 'bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300',
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

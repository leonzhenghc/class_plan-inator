import { NavLink, useNavigate } from 'react-router-dom'
import {
  Calendar,
  CalendarDays,
  ClipboardList,
  Copy,
  LayoutGrid,
  PlayCircle,
  Settings as SettingsIcon,
  Timer,
  User,
} from 'lucide-react'
import { cn } from '../ui/cn.js'
import { useStudySession } from '../../context/StudySessionContext.jsx'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/classes', label: 'Class Planner', icon: CalendarDays },
  { to: '/planner', label: 'Daily Planner', icon: ClipboardList },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/pomodoro', label: 'Pomodoro', icon: Timer },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

/**
 * `className` lets the immersive Pomodoro stage reposition this as a slide-in panel;
 * `onNavigate` lets it close itself once a destination is picked.
 */
export default function Sidebar({ className, onNavigate }) {
  const navigate = useNavigate()
  const { openSetup } = useStudySession()

  // Always lands on the timer with a fresh setup popup, from whichever page you were on.
  const startStudySession = () => {
    navigate('/pomodoro')
    openSetup()
    onNavigate?.()
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-line bg-surface',
        className,
      )}
    >
      <div className="flex items-center gap-3 px-6 pt-7 pb-8">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
          <Copy className="h-5 w-5 text-white" strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <p className="text-[22px] font-extrabold tracking-tight text-brand-600">Clarity</p>
          <p className="text-xs font-medium text-ink-3">Student Workspace</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-semibold transition-colors',
                isActive
                  ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300'
                  : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <span className="absolute top-2 bottom-2 -left-3 w-1 rounded-r-full bg-brand-600" />
                ) : null}
                <Icon
                  className={cn('h-[19px] w-[19px]', isActive ? 'text-brand-600' : 'text-ink-3')}
                  strokeWidth={2}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-5 pb-7">
        <button
          type="button"
          onClick={startStudySession}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 px-2 py-3.5 text-[14px] font-bold whitespace-nowrap text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          <PlayCircle className="h-[18px] w-[18px] shrink-0" strokeWidth={2.25} />
          Start Study Session
        </button>

        <div className="my-5 border-t border-line" />

        <NavLink
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-1 py-1 text-[15px] font-semibold text-ink-2 transition-colors hover:text-brand-600"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/15">
            <User className="h-[18px] w-[18px] text-brand-600" strokeWidth={2} />
          </span>
          Profile Settings
        </NavLink>
      </div>
    </aside>
  )
}

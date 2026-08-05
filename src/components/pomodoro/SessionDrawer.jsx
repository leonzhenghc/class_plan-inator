import { useEffect } from 'react'
import { Lightbulb, ListChecks, X } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Checkbox from '../ui/Checkbox.jsx'
import ProgressBar from '../ui/ProgressBar.jsx'
import { cn } from '../ui/cn.js'
import { activityLog } from '../../data/mock.js'

/**
 * Secondary session content, slid in over the image from the right. The image never
 * resizes behind it — the panel just floats on top and can be closed to go back to a
 * clean full-bleed reveal.
 */
export default function SessionDrawer({
  open,
  onClose,
  config,
  round,
  roundProgress,
  tasks,
  doneTaskIds,
  onToggleTask,
  onOpenSetup,
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <aside
      aria-label="Session details"
      aria-hidden={!open}
      className={cn(
        'absolute inset-y-0 right-0 z-30 flex w-[380px] max-w-[88vw] flex-col bg-gray-50 shadow-2xl',
        'transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
        <p className="text-[15px] font-bold text-gray-900">Session details</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close session details"
          tabIndex={open ? 0 : -1}
          className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <Card className="px-5 py-4">
          <p className="text-[15px] font-bold text-gray-900">Session Progress</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="text-2xl leading-tight font-extrabold tracking-tight text-brand-600">
              {config ? `Round ${Math.min(round, config.rounds)} of ${config.rounds}` : 'Not started'}
            </p>
            <p className="shrink-0 pb-1 text-[13px] text-gray-500">
              {Math.round(roundProgress)}% Completed
            </p>
          </div>
          <ProgressBar value={roundProgress} className="mt-3" />
        </Card>

        <Card className="px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-[13px] font-bold tracking-[0.08em] text-gray-900 uppercase">
              <ListChecks className="h-[18px] w-[18px] text-brand-600" strokeWidth={2} />
              This session
            </p>
            {tasks.length > 0 ? (
              <span className="text-[13px] text-gray-500">
                {doneTaskIds.length}/{tasks.length} done
              </span>
            ) : null}
          </div>

          {tasks.length === 0 ? (
            <p className="mt-3 text-[15px] text-gray-500">
              No tasks picked for this session.{' '}
              <button
                type="button"
                onClick={onOpenSetup}
                tabIndex={open ? 0 : -1}
                className="cursor-pointer font-semibold text-brand-600 hover:text-brand-700"
              >
                Choose some
              </button>
              .
            </p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {tasks.map((task) => {
                const done = doneTaskIds.includes(task.id)
                return (
                  <li key={task.id} className="flex items-start gap-3">
                    <Checkbox
                      checked={done}
                      onChange={() => onToggleTask(task.id)}
                      label={task.title}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block text-[15px] font-semibold',
                          done ? 'text-gray-400 line-through' : 'text-gray-800',
                        )}
                      >
                        {task.title}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-gray-500">{task.meta}</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card className="px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-bold text-gray-900">Activity Log</p>
            <span className="text-[13px] text-gray-500">Today</span>
          </div>

          <ul className="mt-4 space-y-4">
            {activityLog.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-gray-900">{entry.title}</p>
                  <p className="mt-0.5 text-[13px] text-gray-500">{entry.time}</p>
                </div>
                <span className="shrink-0 text-[13px] text-gray-500">{entry.duration}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            tabIndex={open ? 0 : -1}
            className="mt-4 w-full cursor-pointer text-center text-[15px] font-semibold text-brand-600 hover:text-brand-700"
          >
            View Full History
          </button>
        </Card>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <Lightbulb className="h-5 w-5 text-emerald-700" strokeWidth={2} />
          <p className="mt-3 text-[15px] font-bold text-gray-900">Study Tip</p>
          <p className="mt-2 text-[15px] leading-relaxed text-emerald-900/70">
            Hydrate during your short breaks to maintain cognitive performance throughout long
            sessions.
          </p>
        </div>
      </div>
    </aside>
  )
}

import { useMemo, useState } from 'react'
import { CalendarPlus, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import TopBar from '../components/layout/TopBar.jsx'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Checkbox from '../components/ui/Checkbox.jsx'
import StatusTag from '../components/ui/StatusTag.jsx'
import { cn } from '../components/ui/cn.js'
import EventDialog from '../components/planner/EventDialog.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { formatDayHeading, formatHourRange, toDateKey } from '../lib/dates.js'

const START_HOUR = 8
const END_HOUR = 20
const HOUR_HEIGHT = 80

const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

const KIND_THEMES = {
  class: {
    block: 'bg-violet-100 hover:bg-violet-200/70',
    accent: 'bg-brand-600',
    subtitle: 'text-brand-600',
    time: 'text-gray-800',
  },
  study: {
    block: 'bg-sky-100 hover:bg-sky-200/70',
    accent: 'bg-sky-600',
    subtitle: 'text-gray-600',
    time: 'text-gray-800',
  },
  break: {
    block: 'bg-emerald-100 hover:bg-emerald-200/70',
    accent: 'bg-emerald-600',
    subtitle: 'text-emerald-700',
    time: 'text-gray-700',
  },
  personal: {
    block: 'bg-gray-100 hover:bg-gray-200/70',
    accent: 'bg-gray-400',
    subtitle: 'text-gray-600',
    time: 'text-gray-800',
  },
}

function formatHour(hour) {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${String(display).padStart(2, '0')}:00 ${suffix}`
}

export default function DailyPlanner() {
  const { loading, events, tasks, createTask, updateTask, deleteTask } = useWorkspace()
  const [day, setDay] = useState(() => new Date())
  const [draft, setDraft] = useState('')
  const [eventDialog, setEventDialog] = useState({ open: false, editing: null, start: null })

  const dateKey = toDateKey(day)

  const dayEvents = useMemo(
    () =>
      events
        .filter((item) => item.event_date === dateKey)
        .sort((a, b) => Number(a.starts_at) - Number(b.starts_at)),
    [events, dateKey],
  )

  const dayTasks = useMemo(
    () => tasks.filter((item) => item.task_date === dateKey),
    [tasks, dateKey],
  )

  const remaining = dayTasks.filter((task) => !task.done).length

  const shiftDay = (delta) =>
    setDay((current) => {
      const next = new Date(current)
      next.setDate(current.getDate() + delta)
      return next
    })

  const addTask = async (event) => {
    event.preventDefault()
    const title = draft.trim()
    if (!title) return
    setDraft('')
    await createTask({ title, task_date: dateKey })
  }

  return (
    <>
      <TopBar placeholder="Search tasks, notes, or classes..." />

      <main className="flex flex-1 items-start gap-6 px-8 py-8">
        {/* -------------------------------- Timeline ------------------------------- */}
        <Card className="min-w-0 flex-1 px-8 py-7">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                {formatDayHeading(day)}
              </h1>
              <p className="mt-2 text-[15px] text-gray-500">
                {dayEvents.length === 0
                  ? 'Nothing scheduled yet — click a time slot to add something.'
                  : `You have ${dayEvents.length} block${dayEvents.length === 1 ? '' : 's'} scheduled today.`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                icon={CalendarPlus}
                onClick={() => setEventDialog({ open: true, editing: null, start: 9 })}
              >
                Add block
              </Button>
              {[
                { icon: ChevronLeft, label: 'Previous day', delta: -1 },
                { icon: ChevronRight, label: 'Next day', delta: 1 },
              ].map(({ icon: Icon, label, delta }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  onClick={() => shiftDay(delta)}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <Icon className="h-5 w-5" strokeWidth={2.25} />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7 border-t border-gray-200 pt-6">
            <div className="relative pl-[104px]">
              {HOURS.map((hour) => (
                <div key={hour} className="relative h-20 border-t border-gray-100 first:border-t-0">
                  <span className="absolute top-0 -left-[104px] w-[84px] -translate-y-1/2 text-right text-[13px] font-medium text-gray-500">
                    {formatHour(hour)}
                  </span>
                  {/* Clicking empty track opens the dialog pre-filled with that hour. */}
                  <button
                    type="button"
                    aria-label={`Add a block at ${formatHour(hour)}`}
                    onClick={() => setEventDialog({ open: true, editing: null, start: hour })}
                    className="absolute inset-0 w-full cursor-pointer rounded-lg transition-colors hover:bg-brand-50/60"
                  />
                </div>
              ))}

              <div className="pointer-events-none absolute inset-0 left-[104px]">
                {dayEvents.map((event) => {
                  const theme = KIND_THEMES[event.kind] ?? KIND_THEMES.study
                  const start = Number(event.starts_at)
                  const end = Number(event.ends_at)
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setEventDialog({ open: true, editing: event, start: null })}
                      className={cn(
                        'pointer-events-auto absolute right-0 left-0 cursor-pointer overflow-hidden rounded-lg px-5 py-4 text-left transition-colors',
                        theme.block,
                      )}
                      style={{
                        top: `${(start - START_HOUR) * HOUR_HEIGHT}px`,
                        height: `${(end - start) * HOUR_HEIGHT - 6}px`,
                      }}
                    >
                      <span className={cn('absolute inset-y-0 left-0 w-[5px]', theme.accent)} />
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[17px] font-bold text-gray-900">{event.title}</p>
                          {event.subtitle ? (
                            <p className={cn('mt-1 text-[15px]', theme.subtitle)}>
                              {event.subtitle}
                            </p>
                          ) : null}
                          {event.tag ? (
                            <StatusTag tone="focus" className="mt-3">
                              {event.tag}
                            </StatusTag>
                          ) : null}
                        </div>
                        <p className={cn('shrink-0 text-[15px] font-medium', theme.time)}>
                          {formatHourRange(start, end)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* --------------------------------- Tasks -------------------------------- */}
        <Card className="flex w-[380px] shrink-0 flex-col self-stretch px-6 py-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Tasks</h2>
            <span className="rounded-full bg-brand-600 px-3 py-1 text-[13px] font-bold text-white">
              {remaining} Left
            </span>
          </div>

          {loading ? (
            <p className="mt-6 text-[15px] text-gray-400">Loading…</p>
          ) : dayTasks.length === 0 ? (
            <p className="mt-6 text-[15px] leading-relaxed text-gray-500">
              No tasks for this day yet. Add one below and it will be waiting for you.
            </p>
          ) : (
            <ul className="mt-6 space-y-3">
              {dayTasks.map((task) => (
                <li
                  key={task.id}
                  className="group flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3.5"
                >
                  <Checkbox
                    checked={task.done}
                    onChange={() => updateTask(task.id, { done: !task.done })}
                    label={task.title}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-[15px] font-semibold',
                        task.done ? 'text-gray-400 line-through' : 'text-gray-800',
                      )}
                    >
                      {task.title}
                    </p>
                    {task.category ? (
                      <p className="mt-0.5 text-[13px] text-gray-500">{task.category}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    aria-label={`Delete ${task.title}`}
                    className="cursor-pointer rounded-lg p-1.5 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={addTask} className="mt-auto pt-6">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5 pl-4">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Add a new task..."
                aria-label="Add a new task"
                className="h-9 min-w-0 flex-1 text-[15px] text-gray-700 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Add task"
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700"
              >
                <Plus className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>
            <p className="mt-2 text-center text-[13px] text-gray-400">Press Enter to quick-add</p>
          </form>
        </Card>
      </main>

      <EventDialog
        open={eventDialog.open}
        editing={eventDialog.editing}
        dateKey={dateKey}
        defaultStart={eventDialog.start}
        onClose={() => setEventDialog({ open: false, editing: null, start: null })}
      />
    </>
  )
}

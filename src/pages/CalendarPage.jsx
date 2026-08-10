import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import TopBar from '../components/layout/TopBar.jsx'
import Card, { CardTitle } from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import { cn } from '../components/ui/cn.js'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { daysFromToday, toDateKey } from '../lib/dates.js'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const EVENT_CHIP_STYLES = {
  class: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300',
  study: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300',
  break: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  personal: 'bg-surface-2 text-ink-2',
}

function assignmentChipStyle(status, dueAt) {
  if (status === 'done') return 'bg-surface-2 text-ink-3 line-through'
  const days = daysFromToday(dueAt)
  if (days < 0) return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
  if (days === 0) return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700'
  return 'bg-brand-50 dark:bg-brand-500/15 text-brand-600'
}

const MAX_CHIPS = 3

export default function CalendarPage() {
  const { loading, classesById, assignments, events } = useWorkspace()
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const inCurrentMonth =
    month.getFullYear() === new Date().getFullYear() && month.getMonth() === new Date().getMonth()

  /** Fixed 6-week grid so the layout never jumps while browsing months. */
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const start = new Date(first)
    start.setDate(first.getDate() - first.getDay())
    return Array.from({ length: 42 }, (_, offset) => {
      const date = new Date(start)
      date.setDate(start.getDate() + offset)
      return { date, day: date.getDate(), inMonth: date.getMonth() === month.getMonth() }
    })
  }, [month])

  /** Everything placed on a day, assignments first, then events by start time. */
  const byDay = useMemo(() => {
    const map = {}
    const put = (key, item) => {
      ;(map[key] ??= []).push(item)
    }
    for (const assignment of assignments) {
      if (!assignment.due_at) continue
      put(toDateKey(assignment.due_at), {
        ...assignment,
        source: 'assignment',
        classId: assignment.class_id,
      })
    }
    for (const event of events) {
      if (!event.event_date) continue
      put(event.event_date, { ...event, source: 'event' })
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        if (a.source === b.source) return 0
        return a.source === 'assignment' ? -1 : 1
      })
    }
    return map
  }, [assignments, events])

  const shiftMonth = (delta) =>
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))

  const todayKey = toDateKey(new Date())

  return (
    <>
      <TopBar placeholder="Search tasks, classes, or notes..." />

      <main className="flex-1 px-8 py-8">
        <div className="mb-7 flex items-start justify-between gap-6">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight text-ink">Calendar</h1>
            <p className="mt-3 text-lg text-ink-3">
              Every assignment deadline and scheduled block at a glance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-line text-ink-2 transition-colors hover:bg-surface-2"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
            </button>
            <Button
              size="sm"
              variant="ghost"
              className="font-semibold"
              disabled={inCurrentMonth}
              onClick={() => {
                const now = new Date()
                setMonth(new Date(now.getFullYear(), now.getMonth(), 1))
              }}
            >
              Today
            </Button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-line text-ink-2 transition-colors hover:bg-surface-2"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
            </button>
          </div>
        </div>

        <Card className="px-7 py-6">
          <CardTitle>
            {month.toLocaleDateString([], { month: 'long', year: 'numeric' })}
          </CardTitle>

          {loading ? (
            <p className="py-16 text-center text-[15px] text-ink-4">Loading your calendar…</p>
          ) : (
            <div className="mt-6 grid grid-cols-7 gap-2">
              {DAY_LABELS.map((label) => (
                <span
                  key={label}
                  className="text-center text-[13px] font-bold tracking-[0.08em] text-ink-4 uppercase"
                >
                  {label}
                </span>
              ))}

              {cells.map(({ date, day, inMonth }) => {
                const key = toDateKey(date)
                const items = byDay[key] ?? []
                const isToday = key === todayKey
                return (
                  <div
                    key={key}
                    className={cn(
                      'flex min-h-[104px] flex-col gap-1 rounded-xl border p-2',
                      inMonth ? 'bg-surface' : 'bg-surface-2',
                      isToday
                        ? 'border-brand-500 ring-2 ring-brand-200'
                        : 'border-line',
                    )}
                  >
                    <span
                      className={cn(
                        'text-[13px] font-semibold',
                        isToday ? 'text-brand-600' : inMonth ? 'text-ink' : 'text-ink-4',
                      )}
                    >
                      {day}
                    </span>
                    {items.slice(0, MAX_CHIPS).map((item) => (
                      <span
                        key={`${item.source}-${item.id}`}
                        title={
                          item.source === 'assignment'
                            ? `${item.title} — ${classesById[item.classId]?.name ?? 'Unassigned class'}`
                            : item.title
                        }
                        className={cn(
                          'truncate rounded-md px-1.5 py-1 text-[11px] font-semibold',
                          item.source === 'assignment'
                            ? assignmentChipStyle(item.status, item.due_at)
                            : EVENT_CHIP_STYLES[item.kind] ?? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300',
                        )}
                      >
                        {item.source === 'assignment'
                          ? `${classesById[item.classId]?.name.split(' ')[0] ?? 'Class'} · ${item.title}`
                          : item.title}
                      </span>
                    ))}
                    {items.length > MAX_CHIPS ? (
                      <span className="px-1 text-[11px] font-semibold text-ink-4">
                        +{items.length - MAX_CHIPS} more
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-[13px] font-medium text-ink-3">
            <LegendChip className="bg-brand-50 dark:bg-brand-500/15 text-brand-600" label="Assignment" />
            <LegendChip className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" label="Overdue" />
            <LegendChip className="bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300" label="Class block" />
            <LegendChip className="bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300" label="Study block" />
            <LegendChip className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" label="Break" />
            <LegendChip className="bg-surface-2 text-ink-2" label="Personal" />
          </div>
        </Card>
      </main>
    </>
  )
}

function LegendChip({ className, label }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn('h-2.5 w-2.5 rounded-full', className)} />
      {label}
    </span>
  )
}
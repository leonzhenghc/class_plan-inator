import { Fragment, useMemo } from 'react'
import { ArrowRight, Plus } from 'lucide-react'
import { cn } from '../ui/cn.js'
import { daysFromToday, formatHourRange, isSameDay, toDateKey } from '../../lib/dates.js'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_CHIPS = 3

const KIND_DOT = {
  class: 'bg-violet-500',
  study: 'bg-sky-500',
  break: 'bg-emerald-500',
  personal: 'bg-ink-4',
}

function assignmentTone(status, dueAt) {
  if (status === 'done') return 'text-ink-4 line-through'
  const days = daysFromToday(dueAt)
  if (days < 0) return 'text-red-500'
  if (days === 0) return 'text-amber-600 dark:text-amber-400'
  return 'text-brand-600 dark:text-brand-300'
}

/**
 * Month overview. Selecting a day opens a strip immediately beneath that week's
 * row, so the detail stays visually attached to the date rather than living in
 * a panel that permanently eats width.
 */
export default function MonthGrid({
  month,
  events,
  assignments,
  classesById,
  selected,
  onSelect,
  onCreate,
  onOpenEvent,
  onOpenDay,
}) {
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const start = new Date(first)
    start.setDate(first.getDate() - first.getDay())
    return Array.from({ length: 42 }, (_, offset) => {
      const date = new Date(start)
      date.setDate(start.getDate() + offset)
      return { date, inMonth: date.getMonth() === month.getMonth() }
    })
  }, [month])

  const byDay = useMemo(() => {
    const map = {}
    const put = (key, item) => {
      ;(map[key] ??= []).push(item)
    }
    for (const assignment of assignments) {
      if (assignment.due_at) put(toDateKey(assignment.due_at), { ...assignment, source: 'assignment' })
    }
    for (const event of events) {
      if (event.event_date) put(event.event_date, { ...event, source: 'event' })
    }
    for (const key of Object.keys(map)) {
      // Deadlines first, then blocks in the order the day runs.
      map[key].sort((a, b) => {
        if (a.source !== b.source) return a.source === 'assignment' ? -1 : 1
        if (a.source === 'event') return Number(a.starts_at) - Number(b.starts_at)
        return 0
      })
    }
    return map
  }, [assignments, events])

  const selectedKey = selected ? toDateKey(selected) : null
  const weeks = Array.from({ length: 6 }, (_, i) => cells.slice(i * 7, i * 7 + 7))

  return (
    <div className="min-w-0">
      <div className="grid grid-cols-7 gap-px">
        {DAY_LABELS.map((day) => (
          <span
            key={day}
            className="pb-2 text-center text-[11px] font-bold tracking-[0.08em] text-ink-4 uppercase"
          >
            {day}
          </span>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        {weeks.map((week, weekIndex) => {
          const holdsSelection = selectedKey && week.some(({ date }) => toDateKey(date) === selectedKey)

          return (
            <Fragment key={weekIndex}>
              <div className="grid grid-cols-7">
                {week.map(({ date, inMonth }) => {
                  const key = toDateKey(date)
                  const items = byDay[key] ?? []
                  const today = isSameDay(date, new Date())
                  const isSelected = key === selectedKey

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onSelect(isSelected ? null : date)}
                      className={cn(
                        'flex min-h-[92px] cursor-pointer flex-col gap-1 border-t border-l border-line p-1.5 text-left transition-colors first:border-l-0',
                        weekIndex === 0 && 'border-t-0',
                        inMonth ? 'bg-surface' : 'bg-canvas',
                        isSelected ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-surface-2',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold',
                          today
                            ? 'bg-brand-600 text-white'
                            : inMonth
                              ? 'text-ink'
                              : 'text-ink-4',
                        )}
                      >
                        {date.getDate()}
                      </span>

                      {items.slice(0, MAX_CHIPS).map((item) => (
                        <span
                          key={`${item.source}-${item.id}`}
                          className="flex items-center gap-1 truncate text-[11px] font-medium"
                        >
                          {item.source === 'event' ? (
                            <span
                              className={cn(
                                'h-1.5 w-1.5 shrink-0 rounded-full',
                                KIND_DOT[item.kind] ?? KIND_DOT.study,
                              )}
                            />
                          ) : null}
                          <span
                            className={cn(
                              'truncate',
                              item.source === 'assignment'
                                ? assignmentTone(item.status, item.due_at)
                                : 'text-ink-2',
                            )}
                          >
                            {item.title}
                          </span>
                        </span>
                      ))}

                      {items.length > MAX_CHIPS ? (
                        <span className="text-[11px] font-semibold text-ink-4">
                          +{items.length - MAX_CHIPS} more
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>

              {holdsSelection ? (
                <DayStrip
                  date={selected}
                  items={byDay[selectedKey] ?? []}
                  classesById={classesById}
                  onCreate={onCreate}
                  onOpenEvent={onOpenEvent}
                  onOpenDay={onOpenDay}
                />
              ) : null}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

function DayStrip({ date, items, classesById, onCreate, onOpenEvent, onOpenDay }) {
  const events = items.filter((item) => item.source === 'event')
  const assignments = items.filter((item) => item.source === 'assignment')

  return (
    <div className="border-t border-line bg-canvas px-5 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] font-bold text-ink">
          {date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onCreate(date, 9)}
            className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add block
          </button>
          <button
            type="button"
            onClick={() => onOpenDay(date)}
            className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold text-ink-3 hover:text-ink"
          >
            Open day
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {assignments.length > 0 ? (
        <ul className="mb-3 space-y-1">
          {assignments.map((item) => (
            <li key={item.id} className="flex items-baseline gap-3 text-[13px]">
              <span className="w-24 shrink-0 text-ink-4">Due</span>
              <span className={cn('truncate font-medium', assignmentTone(item.status, item.due_at))}>
                {item.title}
              </span>
              <span className="truncate text-ink-4">
                {classesById[item.class_id]?.name ?? ''}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {events.length === 0 ? (
        <p className="text-[13px] text-ink-4">
          Nothing scheduled. Add a block, or say what you need and it will land here.
        </p>
      ) : (
        <ul className="space-y-1">
          {events.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpenEvent(item)}
                className="flex w-full cursor-pointer items-baseline gap-3 rounded-md px-1 py-0.5 text-left text-[13px] transition-colors hover:bg-surface-2"
              >
                <span className="w-24 shrink-0 tabular-nums text-ink-3">
                  {formatHourRange(Number(item.starts_at), Number(item.ends_at)).split(' - ')[0]}
                </span>
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full',
                    KIND_DOT[item.kind] ?? KIND_DOT.study,
                  )}
                />
                <span className="truncate font-medium text-ink">{item.title}</span>
                {item.subtitle ? (
                  <span className="truncate text-ink-4">{item.subtitle}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import TopBar from '../components/layout/TopBar.jsx'
import Button from '../components/ui/Button.jsx'
import SegmentedControl from '../components/ui/SegmentedControl.jsx'
import { cn } from '../components/ui/cn.js'
import MonthGrid from '../components/calendar/MonthGrid.jsx'
import TimeGrid from '../components/calendar/TimeGrid.jsx'
import TaskPanel from '../components/planner/TaskPanel.jsx'
import EventDialog from '../components/planner/EventDialog.jsx'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import {
  addDays,
  addMonths,
  formatWeekRange,
  isSameDay,
  startOfWeek,
  toDateKey,
} from '../lib/dates.js'
import { expandEvents } from '../lib/recurrence.js'

const VIEWS = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
]

const parseDate = (value) => {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

export default function CalendarPage() {
  const { loading, events, assignments, classesById, updateEvent, overrideOccurrence } =
    useWorkspace()
  // View and date live in the URL so back works, refresh keeps your place, and
  // a link to a particular week is shareable.
  const [params, setParams] = useSearchParams()

  const view = VIEWS.some((item) => item.value === params.get('view'))
    ? params.get('view')
    : 'month'
  const anchor = parseDate(params.get('date')) ?? new Date()

  const [selected, setSelected] = useState(null)
  const [dialog, setDialog] = useState({ open: false, editing: null, date: null, start: null })

  /**
   * Always build a fresh URLSearchParams. Mutating the instance react-router
   * hands back updates the URL but leaves the memoised params stale, so the
   * next render still sees the old view.
   */
  const patchParams = useCallback(
    (patch) =>
      setParams((current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(patch)) next.set(key, value)
        return next
      }),
    [setParams],
  )

  const setView = (next) => patchParams({ view: next, date: toDateKey(anchor) })
  const setAnchor = useCallback((next) => patchParams({ date: toDateKey(next) }), [patchParams])

  const step = (direction) => {
    if (view === 'month') setAnchor(addMonths(anchor, direction))
    else if (view === 'week') setAnchor(addDays(anchor, direction * 7))
    else setAnchor(addDays(anchor, direction))
  }

  const days = useMemo(() => {
    if (view === 'day') return [anchor]
    if (view === 'week') {
      const start = startOfWeek(anchor)
      return Array.from({ length: 7 }, (_, i) => addDays(start, i))
    }
    return []
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, toDateKey(anchor)])

  /** Repeating rows become concrete occurrences for whatever span is on screen. */
  const visible = useMemo(() => {
    if (view === 'month') {
      const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
      const from = addDays(first, -first.getDay())
      return expandEvents(events, from, addDays(from, 41))
    }
    return expandEvents(events, days[0], days[days.length - 1])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, view, toDateKey(anchor), days])

  const heading =
    view === 'month'
      ? anchor.toLocaleDateString([], { month: 'long', year: 'numeric' })
      : view === 'week'
        ? formatWeekRange(startOfWeek(anchor))
        : anchor.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })

  const isNow =
    view === 'month'
      ? anchor.getMonth() === new Date().getMonth() &&
        anchor.getFullYear() === new Date().getFullYear()
      : view === 'week'
        ? isSameDay(startOfWeek(anchor), startOfWeek(new Date()))
        : isSameDay(anchor, new Date())

  const openCreate = (date, start) =>
    setDialog({ open: true, editing: null, date, start: start ?? 9 })

  const openDay = (date) => patchParams({ view: 'day', date: toDateKey(date) })

  /**
   * Drag and resize land here. Moving one occurrence of a series detaches just
   * that date rather than shifting every future week — the least destructive
   * reading of dragging a single block.
   */
  const commitTimes = useCallback(
    (item, times) =>
      item.isOccurrence
        ? overrideOccurrence(item.seriesId, item.event_date, times)
        : updateEvent(item.id, times),
    [updateEvent, overrideOccurrence],
  )

  return (
    <>
      <TopBar placeholder="Search tasks, classes, or notes..." />

      <main className="flex min-h-0 flex-1 flex-col px-8 py-6">
        {/* --------------------------------- Toolbar -------------------------------- */}
        <div className="mb-5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous"
              onClick={() => step(-1)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => step(1)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
            </button>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-ink">{heading}</h1>

          <button
            type="button"
            onClick={() => setAnchor(new Date())}
            disabled={isNow}
            className={cn(
              'h-9 cursor-pointer rounded-lg border border-line px-3 text-[13px] font-semibold text-ink-2 transition-colors hover:bg-surface-2',
              isNow && 'cursor-not-allowed opacity-40',
            )}
          >
            Today
          </button>

          <div className="ml-auto flex items-center gap-3">
            <SegmentedControl size="sm" options={VIEWS} value={view} onChange={setView} />
            <Button
              size="sm"
              icon={Plus}
              onClick={() => openCreate(view === 'month' ? (selected ?? new Date()) : anchor, 9)}
            >
              New block
            </Button>
          </div>
        </div>

        {/* ---------------------------------- Views --------------------------------- */}
        {loading ? (
          <p className="py-20 text-center text-[15px] text-ink-4">Loading your calendar…</p>
        ) : view === 'month' ? (
          <MonthGrid
            month={anchor}
            events={visible}
            assignments={assignments}
            classesById={classesById}
            selected={selected}
            onSelect={setSelected}
            onCreate={openCreate}
            onOpenEvent={(item) =>
              setDialog({ open: true, editing: item, date: parseDate(item.event_date), start: null })
            }
            onOpenDay={openDay}
          />
        ) : (
          <div className="flex min-h-0 flex-1 gap-5">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-surface">
              <TimeGrid
                days={days}
                events={visible}
                onCommit={commitTimes}
                onCreate={openCreate}
                onOpen={(item) =>
                  setDialog({
                    open: true,
                    editing: item,
                    date: parseDate(item.event_date),
                    start: null,
                  })
                }
              />
            </div>
            {view === 'day' ? <TaskPanel date={anchor} className="w-[260px] shrink-0" /> : null}
          </div>
        )}

        {view !== 'month' ? (
          <p className="mt-3 text-[12px] text-ink-4">
            Double-click empty space to add a block · drag to move · drag the bottom edge to resize
          </p>
        ) : null}
      </main>

      <EventDialog
        open={dialog.open}
        editing={dialog.editing}
        dateKey={toDateKey(dialog.date ?? anchor)}
        defaultStart={dialog.start}
        onClose={() => setDialog({ open: false, editing: null, date: null, start: null })}
      />
    </>
  )
}

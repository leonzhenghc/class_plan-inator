import { useEffect, useRef, useState } from 'react'
import { cn } from '../ui/cn.js'
import {
  currentHourValue,
  formatHourRange,
  isSameDay,
  toDateKey,
} from '../../lib/dates.js'

export const START_HOUR = 7
export const END_HOUR = 22
export const HOUR_HEIGHT = 56
/** Drags land on quarter hours — fine enough to be useful, coarse enough to hit. */
const SNAP = 0.25
const MIN_DURATION = 0.25

const KIND_STYLES = {
  class: 'bg-violet-500/15 text-violet-800 dark:text-violet-200 border-l-violet-500',
  study: 'bg-sky-500/15 text-sky-800 dark:text-sky-200 border-l-sky-500',
  break: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-l-emerald-500',
  personal: 'bg-ink-4/15 text-ink-2 border-l-ink-4',
}

const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

const snap = (value) => Math.round(value / SNAP) * SNAP
const clampHour = (value) => Math.min(END_HOUR, Math.max(START_HOUR, value))

function label(hour) {
  const suffix = hour >= 12 ? 'pm' : 'am'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display} ${suffix}`
}

/**
 * Shared by the week and day views: an hour rail with one column per day.
 *
 * Events are positioned from their decimal start/end hours. Dragging the body
 * moves a block, dragging the bottom edge resizes it, and both commit through
 * `onCommit` — the same context mutation the dialogs use, so an agent editing
 * the schedule later takes the identical path.
 */
export default function TimeGrid({ days, events, onCommit, onCreate, onOpen, className }) {
  const bodyRef = useRef(null)
  /** Live drag state; null when idle. Kept in state so the block re-renders. */
  const [drag, setDrag] = useState(null)
  const [now, setNow] = useState(currentHourValue)

  useEffect(() => {
    const id = setInterval(() => setNow(currentHourValue()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Pointer move/up live on the window so a fast drag that leaves the grid
  // still tracks, and releasing anywhere still commits.
  useEffect(() => {
    if (!drag) return undefined

    const hoursPerPixel = 1 / HOUR_HEIGHT

    const onMove = (event) => {
      const delta = (event.clientY - drag.originY) * hoursPerPixel
      setDrag((current) => {
        if (!current) return current
        if (current.mode === 'move') {
          const span = current.endsAt - current.startsAt
          let start = clampHour(snap(current.startsAt + delta))
          if (start + span > END_HOUR) start = END_HOUR - span
          return { ...current, previewStart: start, previewEnd: start + span }
        }
        const end = clampHour(snap(current.endsAt + delta))
        return {
          ...current,
          previewStart: current.startsAt,
          previewEnd: Math.max(end, current.startsAt + MIN_DURATION),
        }
      })
    }

    const onUp = () => {
      setDrag((current) => {
        if (current && (current.previewStart !== current.startsAt || current.previewEnd !== current.endsAt)) {
          onCommit(current.event, {
            starts_at: current.previewStart,
            ends_at: current.previewEnd,
          })
        }
        return null
      })
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [drag, onCommit])

  const beginDrag = (mode) => (event, item) => {
    event.preventDefault()
    event.stopPropagation()
    const startsAt = Number(item.starts_at)
    const endsAt = Number(item.ends_at)
    setDrag({
      mode,
      event: item,
      originY: event.clientY,
      startsAt,
      endsAt,
      previewStart: startsAt,
      previewEnd: endsAt,
    })
  }

  const createAt = (day, clientY, target) => {
    const bounds = target.getBoundingClientRect()
    const hour = clampHour(snap(START_HOUR + (clientY - bounds.top) / HOUR_HEIGHT))
    onCreate?.(day, Math.min(hour, END_HOUR - 1))
  }

  return (
    <div className={cn('flex min-h-0 flex-1 overflow-auto', className)}>
      <div className="sticky left-0 z-20 w-14 shrink-0 bg-canvas">
        <div className="h-8" />
        {hours.map((hour) => (
          <div key={hour} className="relative" style={{ height: `${HOUR_HEIGHT}px` }}>
            <span className="absolute -top-2 right-2 text-[11px] font-medium text-ink-4">
              {label(hour)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex min-w-0 flex-1">
        {days.map((day) => {
          const key = toDateKey(day)
          const today = isSameDay(day, new Date())
          const dayEvents = events.filter((item) => item.event_date === key)

          return (
            <div key={key} className="min-w-0 flex-1 border-l border-line first:border-l-0">
              <div
                className={cn(
                  'sticky top-0 z-10 flex h-8 items-center justify-center gap-1.5 bg-canvas text-[12px] font-semibold',
                  today ? 'text-brand-600' : 'text-ink-3',
                )}
              >
                <span className="uppercase">
                  {day.toLocaleDateString([], { weekday: 'short' })}
                </span>
                <span
                  className={cn(
                    'flex h-5 min-w-5 items-center justify-center rounded-full px-1',
                    today && 'bg-brand-600 text-white',
                  )}
                >
                  {day.getDate()}
                </span>
              </div>

              <div
                className="relative"
                style={{ height: `${hours.length * HOUR_HEIGHT}px` }}
                onDoubleClick={(event) => createAt(day, event.clientY, event.currentTarget)}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="border-t border-line/60"
                    style={{ height: `${HOUR_HEIGHT}px` }}
                  />
                ))}

                {today && now >= START_HOUR && now <= END_HOUR ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 border-t border-red-500"
                    style={{ top: `${(now - START_HOUR) * HOUR_HEIGHT}px` }}
                  >
                    <span className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-red-500" />
                  </div>
                ) : null}

                {dayEvents.map((item) => {
                  const dragging = drag?.event.id === item.id
                  const startsAt = dragging ? drag.previewStart : Number(item.starts_at)
                  const endsAt = dragging ? drag.previewEnd : Number(item.ends_at)
                  const top = (startsAt - START_HOUR) * HOUR_HEIGHT
                  const height = Math.max(18, (endsAt - startsAt) * HOUR_HEIGHT - 2)

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onPointerDown={(event) => beginDrag('move')(event, item)}
                      onClick={() => !dragging && onOpen?.(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') onOpen?.(item)
                      }}
                      className={cn(
                        'absolute right-1 left-1 cursor-grab overflow-hidden rounded-md border-l-[3px] px-2 py-1 text-left select-none',
                        KIND_STYLES[item.kind] ?? KIND_STYLES.study,
                        dragging && 'z-30 cursor-grabbing opacity-90 shadow-lg',
                      )}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <p className="truncate text-[12px] font-semibold">{item.title}</p>
                      {height > 34 ? (
                        <p className="truncate text-[11px] opacity-75">
                          {formatHourRange(startsAt, endsAt)}
                        </p>
                      ) : null}

                      <span
                        onPointerDown={(event) => beginDrag('resize')(event, item)}
                        className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { addDays, toDateKey } from './dates.js'

export const WEEKDAYS = [
  { value: 0, label: 'S', full: 'Sunday' },
  { value: 1, label: 'M', full: 'Monday' },
  { value: 2, label: 'T', full: 'Tuesday' },
  { value: 3, label: 'W', full: 'Wednesday' },
  { value: 4, label: 'T', full: 'Thursday' },
  { value: 5, label: 'F', full: 'Friday' },
  { value: 6, label: 'S', full: 'Saturday' },
]

/** Guard against a runaway loop if a range is ever passed in backwards. */
const MAX_DAYS = 400

const parseKey = (key) => {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Expands stored events into the occurrences falling inside [from, to].
 *
 * One-off rows — including the override rows that stand in for a single
 * occurrence — pass through untouched. Repeating rows produce virtual
 * occurrences carrying a composite id, so React keys stay stable and callers
 * can tell a real row from a generated one.
 */
export function expandEvents(events, from, to) {
  const fromKey = toDateKey(from)
  const toKey = toDateKey(to)
  const out = []

  for (const event of events) {
    if (!event.repeat_freq) {
      if (event.event_date >= fromKey && event.event_date <= toKey) {
        out.push({ ...event, seriesId: null, isOccurrence: false })
      }
      continue
    }

    const seriesStart = parseKey(event.event_date)
    const excluded = new Set(event.excluded_dates ?? [])
    const days = event.repeat_days ?? []
    // A weekly rule with no days chosen still repeats on its own start day.
    const weekdays = days.length > 0 ? new Set(days) : new Set([seriesStart.getDay()])

    // Never start before the series does, and never run past its end.
    let cursor = seriesStart > from ? seriesStart : from
    const last = event.repeat_until && event.repeat_until < toKey ? parseKey(event.repeat_until) : to

    for (let guard = 0; cursor <= last && guard < MAX_DAYS; guard += 1) {
      const key = toDateKey(cursor)
      const matches = event.repeat_freq === 'daily' || weekdays.has(cursor.getDay())

      if (matches && !excluded.has(key) && key >= fromKey) {
        out.push({
          ...event,
          id: `${event.id}:${key}`,
          seriesId: event.id,
          event_date: key,
          isOccurrence: true,
        })
      }
      cursor = addDays(cursor, 1)
    }
  }

  return out
}

/** Human-readable rule, for the dialog and list rows. */
export function describeRecurrence(event) {
  if (!event?.repeat_freq) return 'Does not repeat'
  if (event.repeat_freq === 'daily') return 'Every day'

  const days = event.repeat_days ?? []
  if (days.length === 0) return 'Every week'
  if (days.length === 7) return 'Every day'

  const names = WEEKDAYS.filter((day) => days.includes(day.value)).map((day) =>
    day.full.slice(0, 3),
  )
  return `Weekly on ${names.join(', ')}`
}

/** True when this item came out of a series rather than being its own row. */
export const isSeriesOccurrence = (item) => Boolean(item?.isOccurrence)

import { addDays, toDateKey } from './dates.js'
import { expandEvents } from './recurrence.js'

/** Guard against a runaway expansion when resolving a series' next date. */
const LOOKAHEAD_DAYS = 400

/**
 * Builds the deep link a search result jumps to. Every target carries the
 * `?focus=` (or `?focusTask=`) parameter the destination page reads to
 * highlight the exact item, so search lands the user on the thing they picked
 * rather than just another page.
 *
 * Returns `{ to }` — the path with its query string — for `navigate()`.
 */
export function buildTarget(kind, item, today = new Date()) {
  const key = toDateKey(today)

  if (kind === 'class') {
    return { to: `/classes?focus=${item.id}` }
  }

  if (kind === 'assignment') {
    // Assignments render on their class card; without a class (FK cleared by a
    // delete) the plain page is still the right neighborhood.
    return { to: item.class_id ? `/classes?focus=${item.class_id}` : '/classes' }
  }

  if (kind === 'task') {
    return { to: `/calendar?view=day&date=${item.task_date ?? key}&focusTask=${item.id}` }
  }

  if (kind === 'event') {
    // A series points at its calendar row, and the date must be one of its
    // occurrences — the next one on or after today.
    const date = item.repeat_freq ? nextOccurrenceKey(item, today, key) : (item.event_date ?? key)
    return { to: `/calendar?view=day&date=${date}&focus=${item.id}` }
  }

  return { to: '/dashboard' }
}

/**
 * The next date (inclusive of today) on which a series occurs, falling back to
 * the series' own start date when its rule has run out.
 */
function nextOccurrenceKey(series, today, todayKey) {
  const from = series.event_date > todayKey ? parseKey(series.event_date) : today
  const occurrences = expandEvents(
    [series],
    from,
    addDays(from, LOOKAHEAD_DAYS),
  )
  return occurrences[0]?.event_date ?? series.event_date
}

const parseKey = (key) => {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}
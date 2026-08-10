/** Midnight today, in the viewer's own timezone. */
export function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** Whole days from today to `date`: 0 today, 1 tomorrow, -1 yesterday. */
export function daysFromToday(date) {
  if (!date) return null
  const target = new Date(date)
  const midnight = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((midnight - startOfToday()) / 86_400_000)
}

const TIME = { hour: 'numeric', minute: '2-digit' }

/** "Due today, 11:59 PM" · "Due in 3 days" · "Overdue by 2 days". */
export function formatDue(dueAt) {
  if (!dueAt) return 'No due date'
  const date = new Date(dueAt)
  const days = daysFromToday(date)

  if (days === 0) return `Due today, ${date.toLocaleTimeString([], TIME)}`
  if (days === 1) return 'Due tomorrow'
  if (days === -1) return 'Overdue by 1 day'
  if (days < -1) return `Overdue by ${Math.abs(days)} days`
  if (days <= 7) return `Due in ${days} days`
  return `Due ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
}

/** Compact variant for the tight "next assignment" box on a class card. */
export function formatDueShort(dueAt) {
  if (!dueAt) return 'No date'
  const days = daysFromToday(new Date(dueAt))
  if (days === 0) return 'Due Today'
  if (days === 1) return 'Due Tomorrow'
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days <= 7) return `In ${days} days`
  if (days <= 14) return 'Next week'
  return new Date(dueAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

/** Red when it needs attention now, muted otherwise. */
export function dueTone(dueAt, status) {
  if (status === 'done' || !dueAt) return 'text-ink-3'
  const days = daysFromToday(new Date(dueAt))
  if (days <= 0) return 'text-red-500'
  if (days === 1) return 'text-red-500'
  return 'text-ink-3'
}

/* --------------------------- timeline hour values -------------------------- */
/* Events store times as decimal hours (9.5 = 09:30) so a block's position and  */
/* height are simple arithmetic rather than date maths on every render.         */

/** 9.5 → "09:30 AM" */
export function formatHourValue(value) {
  const hours = Math.floor(value)
  const minutes = Math.round((value - hours) * 60)
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const display = hours % 12 === 0 ? 12 : hours % 12
  return `${String(display).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${suffix}`
}

/** "09:00 - 11:30 AM" style range, dropping the repeated meridiem. */
export function formatHourRange(start, end) {
  const from = formatHourValue(start)
  const to = formatHourValue(end)
  const [fromTime, fromSuffix] = from.split(' ')
  const [, toSuffix] = to.split(' ')
  return fromSuffix === toSuffix ? `${fromTime} - ${to}` : `${from} - ${to}`
}

/** 9.5 → "09:30", for `<input type="time">`. */
export function hoursToTimeInput(value) {
  const hours = Math.floor(value)
  const minutes = Math.round((value - hours) * 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** "09:30" → 9.5 */
export function timeInputToHours(value) {
  if (!value) return null
  const [hours, minutes] = value.split(':').map(Number)
  return hours + minutes / 60
}

/** Local YYYY-MM-DD, avoiding the UTC shift `toISOString()` would introduce. */
export function toDateKey(date) {
  const d = new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** "Tuesday, Oct 24" */
export function formatDayHeading(date) {
  return new Date(date).toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

/** Splits an ISO timestamp into the two values `<input type="date|time">` want. */
export function toDateTimeInputs(iso) {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

/** Recombines those inputs into an ISO string, defaulting to end of day. */
export function fromDateTimeInputs(date, time) {
  if (!date) return null
  const [hours, minutes] = (time || '23:59').split(':').map(Number)
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day, hours, minutes).toISOString()
}

/* ------------------------------ week helpers ------------------------------ */

/** Sunday-start week containing `date`, normalised to midnight. */
export function startOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export function addDays(date, count) {
  const d = new Date(date)
  d.setDate(d.getDate() + count)
  return d
}

export function addMonths(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1)
}

export function isSameDay(a, b) {
  return toDateKey(a) === toDateKey(b)
}

/** Decimal hours since midnight, for placing the "now" line. */
export function currentHourValue() {
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60
}

/** "Aug 10 – 16" · "Aug 28 – Sep 3" */
export function formatWeekRange(start) {
  const end = addDays(start, 6)
  const sameMonth = start.getMonth() === end.getMonth()
  const from = start.toLocaleDateString([], { month: 'short', day: 'numeric' })
  const to = end.toLocaleDateString([], sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' })
  return `${from} – ${to}`
}

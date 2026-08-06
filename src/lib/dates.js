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
  if (status === 'done' || !dueAt) return 'text-gray-500'
  const days = daysFromToday(new Date(dueAt))
  if (days <= 0) return 'text-red-500'
  if (days === 1) return 'text-red-500'
  return 'text-gray-500'
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

import { useMemo } from 'react'
import { useWorkspace } from '../context/WorkspaceContext.jsx'
import { toDateKey } from '../lib/dates.js'

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/**
 * Everything the dashboard and the session drawer show about past focus time,
 * derived from `pomodoro_sessions`. Breaks are ignored — only focus minutes
 * count toward velocity, the weekly comparison and the streak.
 */
export function useStudyStats() {
  const { sessions } = useWorkspace()

  return useMemo(() => {
    const focusSessions = sessions.filter((item) => item.phase === 'focus')

    /** Focus minutes keyed by local date, so day boundaries match the user's clock. */
    const minutesByDay = new Map()
    for (const session of focusSessions) {
      const key = toDateKey(session.completed_at)
      minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + session.minutes)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dayAt = (offset) => {
      const date = new Date(today)
      date.setDate(today.getDate() + offset)
      return date
    }

    // Last seven days, oldest first, so the chart reads left to right.
    const velocity = Array.from({ length: 7 }, (_, index) => {
      const date = dayAt(index - 6)
      const minutes = minutesByDay.get(toDateKey(date)) ?? 0
      return {
        day: DAY_INITIALS[date.getDay()],
        minutes,
        isToday: index === 6,
      }
    })

    const peak = Math.max(...velocity.map((entry) => entry.minutes), 0)

    const sumRange = (from, to) => {
      let total = 0
      for (let offset = from; offset <= to; offset += 1) {
        total += minutesByDay.get(toDateKey(dayAt(offset))) ?? 0
      }
      return total
    }

    const thisWeek = sumRange(-6, 0)
    const lastWeek = sumRange(-13, -7)

    let focusChange = null
    if (lastWeek > 0) focusChange = Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
    else if (thisWeek > 0) focusChange = 100

    // Streak runs back from today, but a day that hasn't started yet shouldn't
    // break it — so an empty today just moves the start back to yesterday.
    let streak = 0
    let cursor = (minutesByDay.get(toDateKey(today)) ?? 0) > 0 ? 0 : -1
    while ((minutesByDay.get(toDateKey(dayAt(cursor))) ?? 0) > 0) {
      streak += 1
      cursor -= 1
    }

    return {
      velocity,
      peak,
      thisWeekMinutes: thisWeek,
      lastWeekMinutes: lastWeek,
      focusChange,
      streak,
      todayMinutes: minutesByDay.get(toDateKey(today)) ?? 0,
      /** Newest first, already ordered by the query. */
      recent: sessions.slice(0, 6),
      hasHistory: focusSessions.length > 0,
    }
  }, [sessions])
}

/** "25m" · "1h 05m" */
export function formatMinutes(minutes) {
  if (!minutes) return '0m'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest}m`
  return rest ? `${hours}h ${String(rest).padStart(2, '0')}m` : `${hours}h`
}

import { addDays, formatHourRange, toDateKey } from './dates.js'
import { WEEKDAYS } from './recurrence.js'

export const SEMESTERS = [
  { value: 'fall', label: 'Fall' },
  { value: 'winter', label: 'Winter' },
  { value: 'spring', label: 'Spring' },
  { value: 'summer', label: 'Summer' },
]

export const SEMESTER_LABELS = Object.fromEntries(
  SEMESTERS.map(({ value, label }) => [value, label]),
)

/** Guard against a runaway loop if the range is ever passed in backwards. */
const MAX_DAYS = 400

const parseKey = (key) => {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Turns a class's schedule into the recurring event row that represents it on
 * the calendar. One row per class: the weekly rule covers every meeting day,
 * so the existing recurrence engine expands the whole semester for free.
 *
 * Fields come from the API the way PostgREST returns them: dates as
 * 'YYYY-MM-DD', times as decimal hours, meeting days as 0 … 6 (Sunday-first,
 * matching JS getDay()).
 *
 * Returns { schedule, error }: schedule is the insert payload (with the class
 * as the series' fixed block), or null when no schedule was provided at all.
 */
export function buildClassSchedule({
  classId,
  name,
  startsOn,
  endsOn,
  startTime,
  endTime,
  meetingDays,
}) {
  const provided = [startsOn, endsOn, startTime, endTime].some(
    (value) => value !== null && value !== undefined && value !== '',
  )
  meetingDays = meetingDays ?? []

  // Nothing entered — no schedule. Same shape as a class saved before this
  // feature existed, so editing an old class works without touching anything.
  if (!provided) return { schedule: null, error: null }

  if (!startsOn || !endsOn || startTime === null || startTime === '' || endTime === null || endTime === '') {
    return { error: new Error('Fill in the start and end dates and the class time to set a schedule.') }
  }
  if (meetingDays.length === 0) {
    return { error: new Error('Pick at least one day the class meets.') }
  }
  if (endsOn < startsOn) {
    return { error: new Error('The classes end date has to come after the start date.') }
  }
  if (Number(endTime) <= Number(startTime)) {
    return { error: new Error('The end time has to be after the start time.') }
  }

  // The series starts on the first meeting day inside the range; if the range
  // contains no meeting day there is nothing to schedule.
  let first = null
  for (let cursor = parseKey(startsOn), guard = 0; cursor <= parseKey(endsOn) && guard < MAX_DAYS; guard += 1) {
    if (meetingDays.includes(cursor.getDay())) {
      first = cursor
      break
    }
    cursor = addDays(cursor, 1)
  }
  if (!first) {
    return { error: new Error('None of the meeting days fall inside the dates you gave.') }
  }

  return {
    schedule: {
      title: name,
      subtitle: '',
      kind: 'class',
      event_date: toDateKey(first),
      starts_at: Number(startTime),
      ends_at: Number(endTime),
      tag: '',
      class_id: classId,
      repeat_freq: 'weekly',
      repeat_days: [...meetingDays],
      repeat_until: endsOn,
      fixed: true,
    },
    error: null,
  }
}

/** Human-readable summary for class cards: which days, when, and for how long. */
export function describeSchedule(course) {
  const days = course.meeting_days ?? []
  if (!course.start_time || days.length === 0) return null

  const names = WEEKDAYS.filter((day) => days.includes(day.value)).map((day) => day.full.slice(0, 3))
  const range = formatHourRange(Number(course.start_time), Number(course.end_time))
  const span =
    course.starts_on && course.ends_on
      ? `${course.starts_on} – ${course.ends_on}`
      : null

  return [names.join(', '), range, span].filter(Boolean).join(' · ')
}
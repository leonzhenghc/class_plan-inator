import { describe, it, expect } from 'vitest'
import { buildClassSchedule, describeSchedule } from './classSchedule.js'
import { expandEvents } from './recurrence.js'

const base = {
  classId: 'c1',
  name: 'Quantum Physics',
  startsOn: '2026-08-24',
  endsOn: '2026-12-12',
  startTime: 9,
  endTime: 10.5,
  meetingDays: [1, 3, 5],
}

function schedule(overrides) {
  return buildClassSchedule({ ...base, ...overrides })
}

describe('buildClassSchedule', () => {
  it('returns no schedule when nothing is provided', () => {
    const { schedule, error } = buildClassSchedule({ classId: 'c1', name: 'x' })
    expect(schedule).toBeNull()
    expect(error).toBeNull()
  })

  it('starts on the first meeting day inside the range', () => {
    // 2026-08-24 is a Monday — an exact match.
    expect(schedule().schedule.event_date).toBe('2026-08-24')
  })

  it('advances to the next meeting day when the start date does not match', () => {
    // 2026-08-26 is a Wednesday — the third selected day.
    const { schedule: built } = schedule({ startsOn: '2026-08-26' })
    expect(built.event_date).toBe('2026-08-26')
    // 2026-08-27 is a Thursday — must skip to Friday the 28th.
    const { schedule: thursday } = schedule({ startsOn: '2026-08-27' })
    expect(thursday.event_date).toBe('2026-08-28')
    // 2026-08-30 is a Sunday — must skip to Monday the 31st.
    const { schedule: sunday } = schedule({ startsOn: '2026-08-30' })
    expect(sunday.event_date).toBe('2026-08-31')
  })

  it('builds a fixed weekly rule over the meeting days', () => {
    const { schedule: built, error } = schedule()
    expect(error).toBeNull()
    expect(built).toMatchObject({
      title: 'Quantum Physics',
      kind: 'class',
      class_id: 'c1',
      starts_at: 9,
      ends_at: 10.5,
      repeat_freq: 'weekly',
      repeat_days: [1, 3, 5],
      repeat_until: '2026-12-12',
      fixed: true,
    })
  })

  it('expands across the whole semester through the recurrence engine', () => {
    const { schedule: built } = schedule()
    const occurrences = expandEvents([built], new Date(2026, 7, 24), new Date(2026, 11, 12))
    expect(occurrences).toHaveLength(48) // 16 weeks × 3 days
    expect(occurrences.every((item) => item.isOccurrence)).toBe(true)
  })

  it('rejects an end before the start', () => {
    const { error } = schedule({ endsOn: '2026-08-20' })
    expect(error.message).toMatch(/end date has to come after/)
  })

  it('rejects an inverted time range', () => {
    const { error } = schedule({ startTime: 11, endTime: 9 })
    expect(error.message).toMatch(/end time has to be after/)
  })

  it('rejects missing fields when a schedule is requested', () => {
    expect(schedule({ startsOn: null }).error.message).toMatch(/start and end dates/)
    expect(schedule({ startTime: null }).error.message).toMatch(/start and end dates/)
  })

  it('rejects when no meeting day falls inside the range', () => {
    // 2026-08-24 (Mon) to 2026-08-28 (Fri) contains no Sunday (0).
    const { error } = schedule({ startsOn: '2026-08-24', endsOn: '2026-08-28', meetingDays: [0] })
    expect(error.message).toMatch(/None of the meeting days/)
  })

  it('rejects when no meeting day is picked', () => {
    const { error } = schedule({ meetingDays: [] })
    expect(error.message).toMatch(/Pick at least one day/)
  })

  it('is immune to the input arrays it is given', () => {
    const days = [1, 3, 5]
    const { schedule: built } = schedule({ meetingDays: days })
    days.push(6)
    expect(built.repeat_days).toEqual([1, 3, 5])
  })
})

describe('describeSchedule', () => {
  it('summarises days, time and span for a card', () => {
    expect(
      describeSchedule({
        meeting_days: [1, 3, 5],
        start_time: 9,
        end_time: 10.5,
        starts_on: '2026-08-24',
        ends_on: '2026-12-12',
      }),
    ).toBe('Mon, Wed, Fri · 09:00 - 10:30 AM · 2026-08-24 – 2026-12-12')
  })

  it('returns null for unscheduled classes', () => {
    expect(describeSchedule({ meeting_days: [], start_time: null })).toBeNull()
    expect(describeSchedule({ meeting_days: [], start_time: 9, end_time: 10 })).toBeNull()
    expect(describeSchedule({ meeting_days: [1], start_time: null })).toBeNull()
  })
})
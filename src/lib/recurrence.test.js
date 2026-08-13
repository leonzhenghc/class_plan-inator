import { describe, it, expect } from 'vitest'
import { expandEvents, describeRecurrence, isSeriesOccurrence } from './recurrence.js'

/** Local-midnight date from a YYYY-MM-DD key, matching how the app builds dates. */
function d(key) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

let seq = 0
function ev(date, overrides = {}) {
  return { id: `e${++seq}`, title: 'Block', event_date: date, ...overrides }
}

function expand(events, from, to) {
  return expandEvents(events, d(from), d(to))
}

describe('expandEvents', () => {
  it('passes one-offs through untouched, range boundaries inclusive', () => {
    const oneOffs = [ev('2026-09-01'), ev('2026-09-07')]
    const out = expand(oneOffs, '2026-09-01', '2026-09-07')

    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ id: 'e1', isOccurrence: false, seriesId: null })
    expect(out[1]).toMatchObject({ id: 'e2', isOccurrence: false })
  })

  it('drops one-offs outside the range', () => {
    expect(expand([ev('2026-09-10')], '2026-09-01', '2026-09-07')).toHaveLength(0)
  })

  it('expands a weekly series to every chosen weekday, with composite ids', () => {
    const series = ev('2026-09-01', { repeat_freq: 'weekly', repeat_days: [1, 3, 5] })
    const out = expand([series], '2026-09-01', '2026-09-13')

    expect(out.map((item) => item.event_date)).toEqual([
      '2026-09-02',
      '2026-09-04',
      '2026-09-07',
      '2026-09-09',
      '2026-09-11',
    ])
    expect(out.map((item) => item.id)).toEqual([
      `${series.id}:2026-09-02`,
      `${series.id}:2026-09-04`,
      `${series.id}:2026-09-07`,
      `${series.id}:2026-09-09`,
      `${series.id}:2026-09-11`,
    ])
    expect(out.every((item) => item.isOccurrence && item.seriesId === series.id)).toBe(true)
  })

  it('expands a daily series on every day', () => {
    const out = expand([ev('2026-09-01', { repeat_freq: 'daily' })], '2026-09-01', '2026-09-05')
    expect(out).toHaveLength(5)
  })

  it('stops a series at repeat_until, inclusive', () => {
    const out = expand(
      [ev('2026-09-01', { repeat_freq: 'daily', repeat_until: '2026-09-03' })],
      '2026-09-01',
      '2026-09-07',
    )
    expect(out).toHaveLength(3)
  })

  it('produces nothing when repeat_until already passed', () => {
    const out = expand(
      [ev('2026-09-01', { repeat_freq: 'daily', repeat_until: '2026-09-05' })],
      '2026-09-08',
      '2026-09-12',
    )
    expect(out).toHaveLength(0)
  })

  it('never emits occurrences before the series start date', () => {
    const out = expand(
      [ev('2026-09-01', { repeat_freq: 'daily' })],
      '2026-08-24',
      '2026-08-31',
    )
    expect(out).toHaveLength(0)
  })

  it('skips excluded dates', () => {
    const out = expand(
      [ev('2026-09-01', { repeat_freq: 'daily', excluded_dates: ['2026-09-03', '2026-09-04'] })],
      '2026-09-01',
      '2026-09-05',
    )
    expect(out.map((item) => item.event_date)).toEqual(['2026-09-01', '2026-09-02', '2026-09-05'])
  })

  it('repeats weekly rules with no chosen days on the start day only', () => {
    const out = expand(
      [ev('2026-09-02', { repeat_freq: 'weekly', repeat_days: [] })],
      '2026-09-01',
      '2026-09-13',
    )
    expect(out.map((item) => item.event_date)).toEqual(['2026-09-02', '2026-09-09'])
  })

  it('keeps an override and its series from each doubling a date', () => {
    const series = ev('2026-09-01', {
      repeat_freq: 'daily',
      excluded_dates: ['2026-09-03'],
    })
    const override = ev('2026-09-03', { recurrence_id: series.id })

    const out = expand([series, override], '2026-09-01', '2026-09-05')

    const onThird = out.filter((item) => item.event_date === '2026-09-03')
    expect(onThird).toHaveLength(1)
    expect(onThird[0]).toMatchObject({ id: override.id, isOccurrence: false })
  })

  it('marks a weekly rule on every weekday as an everyday series', () => {
    const out = expand(
      [ev('2026-09-01', { repeat_freq: 'weekly', repeat_days: [0, 1, 2, 3, 4, 5, 6] })],
      '2026-09-01',
      '2026-09-03',
    )
    expect(out).toHaveLength(3)
  })
})

describe('describeRecurrence', () => {
  it('describes one-offs, empty weekdays, and named weekdays', () => {
    expect(describeRecurrence({ repeat_freq: null })).toBe('Does not repeat')
    expect(describeRecurrence({ repeat_freq: 'weekly', repeat_days: [] })).toBe('Every week')
    expect(
      describeRecurrence({ repeat_freq: 'weekly', repeat_days: [1, 3, 5] }),
    ).toBe('Weekly on Mon, Wed, Fri')
    expect(describeRecurrence({ repeat_freq: 'daily' })).toBe('Every day')
  })
})

describe('isSeriesOccurrence', () => {
  it('tells virtual occurrences from real rows', () => {
    expect(isSeriesOccurrence(ev('2026-09-01'))).toBe(false)
    expect(isSeriesOccurrence({ ...ev('2026-09-01'), isOccurrence: true })).toBe(true)
  })
})
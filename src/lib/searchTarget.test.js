import { describe, expect, it } from 'vitest'
import { buildTarget } from './searchTarget.js'

// 2026-08-13 is a Thursday.
const today = new Date(2026, 7, 13)

describe('buildTarget', () => {
  it('deep-links a class to its card', () => {
    expect(buildTarget('class', { id: 'c1' }, today).to).toBe('/classes?focus=c1')
  })

  it('deep-links an assignment to its class card', () => {
    expect(buildTarget('assignment', { id: 'a1', class_id: 'c1' }, today).to).toBe(
      '/classes?focus=c1',
    )
  })

  it('falls back to the classes page for orphaned assignments', () => {
    expect(buildTarget('assignment', { id: 'a1', class_id: null }, today).to).toBe('/classes')
  })

  it('deep-links a task to its day', () => {
    expect(buildTarget('task', { id: 't1', task_date: '2026-08-13' }, today).to).toBe(
      '/calendar?view=day&date=2026-08-13&focusTask=t1',
    )
  })

  it('uses today when a task has no date', () => {
    expect(buildTarget('task', { id: 't1' }, today).to).toBe(
      '/calendar?view=day&date=2026-08-13&focusTask=t1',
    )
  })

  it('lands a one-off event on its own date', () => {
    expect(buildTarget('event', { id: 'e1', event_date: '2026-09-01' }, today).to).toBe(
      '/calendar?view=day&date=2026-09-01&focus=e1',
    )
  })

  it('lands a weekly series on its next occurrence at or after today', () => {
    // Mon/Wed/Fri series starting 2026-08-10: next occurrence after Thu 13th is Fri 14th.
    const series = {
      id: 'e1',
      event_date: '2026-08-10',
      repeat_freq: 'weekly',
      repeat_days: [1, 3, 5],
    }
    expect(buildTarget('event', series, today).to).toBe(
      '/calendar?view=day&date=2026-08-14&focus=e1',
    )
  })

  it('lands a daily series on today', () => {
    const series = { id: 'e1', event_date: '2026-08-01', repeat_freq: 'daily' }
    expect(buildTarget('event', series, today).to).toBe(
      '/calendar?view=day&date=2026-08-13&focus=e1',
    )
  })

  it('falls back to the series start date once the rule has ended', () => {
    const ended = {
      id: 'e1',
      event_date: '2026-08-01',
      repeat_freq: 'weekly',
      repeat_days: [1, 3, 5],
      repeat_until: '2026-08-05',
    }
    expect(buildTarget('event', ended, today).to).toBe(
      '/calendar?view=day&date=2026-08-01&focus=e1',
    )
  })

  it('falls back to the dashboard for unknown kinds', () => {
    expect(buildTarget('notes', { id: 'x' }, today).to).toBe('/dashboard')
  })
})

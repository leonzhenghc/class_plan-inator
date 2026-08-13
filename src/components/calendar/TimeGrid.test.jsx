import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TimeGrid from './TimeGrid.jsx'
import { toDateKey } from '../../lib/dates.js'

const day = new Date(2026, 7, 13)

const events = [
  {
    id: 'e1',
    title: 'Study session',
    event_date: toDateKey(day),
    starts_at: 9,
    ends_at: 10,
    kind: 'study',
    fixed: false,
  },
]

describe('TimeGrid focus highlight', () => {
  it('rings the focused block', () => {
    render(
      <TimeGrid
        days={[day]}
        events={events}
        focusedId="e1"
        onCommit={() => {}}
        onCreate={() => {}}
        onOpen={() => {}}
      />,
    )
    expect(screen.getByText('Study session').closest('[data-event-id="e1"]')).toHaveClass('ring-2')
  })

  it('leaves blocks alone without a focus', () => {
    render(
      <TimeGrid
        days={[day]}
        events={events}
        onCommit={() => {}}
        onCreate={() => {}}
        onOpen={() => {}}
      />,
    )
    expect(screen.getByText('Study session').closest('[data-event-id="e1"]')).not.toHaveClass(
      'ring-2',
    )
  })
})

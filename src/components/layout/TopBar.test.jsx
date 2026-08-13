import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import TopBar from './TopBar.jsx'

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ profile: null }),
}))

vi.mock('../../context/WorkspaceContext.jsx', () => ({
  useWorkspace: () => ({
    classes: [{ id: 'c1', name: 'Physics 101', professor: 'Dr. Lee', category: 'STEM' }],
    assignments: [{ id: 'a1', title: 'Problem set 1', due_at: null, class_id: 'c1' }],
    tasks: [{ id: 't1', title: 'Read chapter 3', category: 'Reading', task_date: '2026-08-13' }],
    events: [
      {
        id: 'e1',
        title: 'Study session',
        subtitle: 'Library',
        event_date: '2026-08-14',
        repeat_freq: null,
      },
    ],
  }),
}))

function LocationProbe() {
  const location = useLocation()
  return (
    <span data-testid="location">
      {location.pathname}
      {location.search}
    </span>
  )
}

function Harness() {
  return (
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<TopBar />} />
        <Route path="/classes" element={<LocationProbe />} />
        <Route path="/calendar" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('TopBar search deep links', () => {
  it('jumps a class result to its focus link', () => {
    render(<Harness />)
    fireEvent.focus(screen.getByLabelText('Search'))
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'physics' } })
    fireEvent.click(screen.getByText('Physics 101'))
    expect(screen.getByTestId('location')).toHaveTextContent('/classes?focus=c1')
  })

  it('jumps a task result to its day with the task focus', () => {
    render(<Harness />)
    fireEvent.focus(screen.getByLabelText('Search'))
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'chapter' } })
    fireEvent.click(screen.getByText('Read chapter 3'))
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/calendar?view=day&date=2026-08-13&focusTask=t1',
    )
  })

  it('jumps an event result to its day with the event focus', () => {
    render(<Harness />)
    fireEvent.focus(screen.getByLabelText('Search'))
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'study session' } })
    fireEvent.click(screen.getByText('Study session'))
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/calendar?view=day&date=2026-08-14&focus=e1',
    )
  })

  it('Enter on a query with results takes the first hit', () => {
    render(<Harness />)
    fireEvent.focus(screen.getByLabelText('Search'))
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'problem' } })
    fireEvent.keyDown(screen.getByLabelText('Search'), { key: 'Enter' })
    expect(screen.getByTestId('location')).toHaveTextContent('/classes?focus=c1')
  })
})

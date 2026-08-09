import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  user: { id: 'u1' },
  profile: null,
  updateProfile: null,
  createClass: null,
  navigate: null,
}))

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: mocks.user,
    profile: mocks.profile,
    loading: false,
    profileLoaded: true,
    needsOnboarding: true,
    updateProfile: mocks.updateProfile,
  }),
}))

vi.mock('../context/WorkspaceContext.jsx', () => ({
  useWorkspace: () => ({ createClass: mocks.createClass }),
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  }
})

import Onboarding from './Onboarding.jsx'

beforeEach(() => {
  mocks.profile = { full_name: '', display_name: '', onboarded_at: null }
  mocks.updateProfile = vi.fn().mockResolvedValue({ error: null })
  mocks.createClass = vi.fn().mockResolvedValue({ error: null })
  mocks.navigate = vi.fn()
})

/** Walks profile → personality → classes, then finishes. */
async function completeOnboardingWithClass(name, professor = '') {
  render(<Onboarding />)

  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Ada Lovelace' } })
  fireEvent.change(screen.getByLabelText('School'), { target: { value: 'Analytical Engines' } })
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

  fireEvent.change(screen.getByLabelText('Class name'), { target: { value: name } })
  if (professor) {
    fireEvent.change(screen.getByLabelText('Professor'), { target: { value: professor } })
  }
  fireEvent.click(screen.getByRole('button', { name: 'Finish setup' }))

  await waitFor(() => expect(mocks.createClass).toHaveBeenCalled())
}

describe('Onboarding class creation', () => {
  it('creates classes through the workspace context, not a raw insert', async () => {
    await completeOnboardingWithClass('Linear Algebra', 'Prof. Ada')

    expect(mocks.createClass).toHaveBeenCalledWith({
      name: 'Linear Algebra',
      professor: 'Prof. Ada',
      category: 'STEM',
    })
    expect(mocks.navigate).toHaveBeenCalledWith('/dashboard', { replace: true })
  })

  it('stops at the first class failure and does not navigate', async () => {
    mocks.createClass
      .mockResolvedValueOnce({ error: { message: 'insert rejected' } })
      .mockResolvedValueOnce({ error: null })

    render(<Onboarding />)
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Ada Lovelace' } })
    fireEvent.change(screen.getByLabelText('School'), { target: { value: 'Analytical Engines' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    fireEvent.change(screen.getByLabelText('Class name'), { target: { value: 'First Class' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add another class' }))
    fireEvent.change(screen.getAllByLabelText('Class name')[1], { target: { value: 'Second Class' } })
    fireEvent.click(screen.getByRole('button', { name: 'Finish setup' }))

    await waitFor(() => expect(mocks.createClass).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('alert')).toHaveTextContent('insert rejected')
    expect(mocks.navigate).not.toHaveBeenCalled()
  })
})
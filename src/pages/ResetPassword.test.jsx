import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'

const auth = vi.hoisted(() => ({ user: null, loading: false, updatePassword: vi.fn() }))

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: auth.user,
    loading: auth.loading,
    updatePassword: auth.updatePassword,
  }),
}))

vi.mock('../lib/supabase.js', () => ({
  isSupabaseConfigured: true,
  friendlyAuthError: (error) => error?.message ?? 'something failed',
}))

import ResetPassword from './ResetPassword.jsx'

function renderAt(hash) {
  window.history.replaceState({}, '', `/reset-password${hash ? `#${hash}` : ''}`)
  return render(
    <MemoryRouter initialEntries={[`/reset-password${hash ? `#${hash}` : ''}`]}>
      <ResetPassword />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  auth.user = null
  auth.updatePassword.mockReset()
  auth.updatePassword.mockResolvedValue({ error: null })
})

describe('ResetPassword', () => {
  it('keeps the OTP in the URL so the auth client can still read it', () => {
    // Regression for the manual replaceState: it used to run before GoTrue
    // consumed the token, silently breaking every valid reset link.
    auth.user = { id: 'u1', email: 'a@b.co' }
    renderAt('access_token=fake-recovery-token&type=recovery')
    
    expect(window.location.hash).toContain('access_token=fake-recovery-token')
    // The session is present, so the form is what is shown.
    expect(screen.getByLabelText('New password')).toBeInTheDocument()
  })

  it('shows the invalid-link screen without a session', () => {
    renderAt('')
    expect(screen.getByText("That link didn't work")).toBeInTheDocument()
  })

  it('calls updatePassword with the matching password', async () => {
    auth.user = { id: 'u1', email: 'a@b.co' }
    renderAt('access_token=abc&type=recovery')

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'long-enough' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), {
      target: { value: 'long-enough' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }))

    await waitFor(() => expect(auth.updatePassword).toHaveBeenCalledWith('long-enough'))
    expect(screen.getByText('Password updated')).toBeInTheDocument()
  })
})
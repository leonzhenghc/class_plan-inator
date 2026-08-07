import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'

const auth = vi.hoisted(() => ({ user: null, loading: false, resendConfirmation: vi.fn() }))

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: auth.user,
    loading: auth.loading,
    resendConfirmation: auth.resendConfirmation,
  }),
}))

vi.mock('../lib/supabase.js', () => ({
  isSupabaseConfigured: true,
  friendlyAuthError: (error) => error?.message ?? 'something failed',
}))

import ConfirmEmail from './ConfirmEmail.jsx'

function renderAt(hash) {
  window.history.replaceState({}, '', `/confirm-email${hash ? `#${hash}` : ''}`)
  return render(
    <MemoryRouter initialEntries={[`/confirm-email${hash ? `#${hash}` : ''}`]}>
      <ConfirmEmail />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  auth.user = null
  auth.resendConfirmation.mockReset()
  auth.resendConfirmation.mockResolvedValue({ error: null })
})

describe('ConfirmEmail', () => {
  it('keeps the OTP in the URL so the auth client can still read it', () => {
    auth.user = { id: 'u1', email: 'student@uni.edu' }
    renderAt('access_token=fake-confirm-token&type=signup')
    expect(window.location.hash).toContain('access_token=fake-confirm-token')
    expect(screen.getByText('Email confirmed')).toBeInTheDocument()
  })

  it('resends the confirmation to the typed address', async () => {
    renderAt('')

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'student@uni.edu' } })
    fireEvent.click(screen.getByRole('button', { name: 'Resend confirmation' }))

    await waitFor(() =>
      expect(auth.resendConfirmation).toHaveBeenCalledWith('student@uni.edu'),
    )
    expect(screen.getByText('Confirmation sent')).toBeInTheDocument()
  })
})
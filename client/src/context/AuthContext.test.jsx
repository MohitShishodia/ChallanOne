import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'

const createToken = (exp) => `header.${btoa(JSON.stringify({ exp }))}.signature`

function AuthState() {
  const { user, login } = useAuth()

  return (
    <>
      <span>{user?.email || 'Signed out'}</span>
      <button onClick={() => login({ email: 'user@test.com' }, createToken(10001))}>
        Log in
      </button>
    </>
  )
}

describe('AuthContext token expiry', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(10000000)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('logs out when the stored token has already expired', () => {
    localStorage.setItem('authToken', createToken(9999))
    localStorage.setItem('user', JSON.stringify({ email: 'user@test.com' }))

    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>
    )

    act(() => {
      vi.advanceTimersByTime(0)
    })

    expect(screen.getByText('Signed out')).toBeInTheDocument()
    expect(localStorage.getItem('authToken')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('logs out automatically when the active token expires', () => {
    render(
      <AuthProvider>
        <AuthState />
      </AuthProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.getByText('user@test.com')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByText('Signed out')).toBeInTheDocument()
    expect(localStorage.getItem('authToken')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})
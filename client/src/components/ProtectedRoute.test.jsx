import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/pay-challan' })
  }
})

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn()
}))

import { useAuth } from '../context/AuthContext'

function renderRoute(user) {
  useAuth.mockReturnValue({ user })
  return render(
    <MemoryRouter>
      <ProtectedRoute>
        <div data-testid="protected-content">Secret Content</div>
      </ProtectedRoute>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('renders children when user is logged in', () => {
    renderRoute({ email: 'user@test.com', name: 'Test User' })
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
  })

  it('shows login prompt when user is not logged in', () => {
    renderRoute(null)
    expect(screen.getByText('Sign in to continue')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Login \/ Sign Up/i })).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })
})

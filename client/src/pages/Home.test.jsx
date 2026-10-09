import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import Home from './Home'

vi.mock('../components/Illustrations', () => ({
  HeroHomeIllustration: () => <div data-testid="hero-illustration" />,
  SupportIllustration: () => <div data-testid="support-illustration" />
}))

describe('Home page', () => {
  it('renders the updated hero heading and search entry point', () => {
    render(
      <MemoryRouter>
        <AuthProvider><Home /></AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: /instantly/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Sign in to Get Started/i })).toBeInTheDocument()
  })

  it('shows trust badge', () => {
    render(
      <MemoryRouter>
        <AuthProvider><Home /></AuthProvider>
      </MemoryRouter>
    )

    expect(screen.getByText("India's Most Trusted Vehicle Verification Platform")).toBeInTheDocument()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'

vi.mock('../components/Illustrations', () => ({
  HeroHomeIllustration: () => <div data-testid="hero-illustration" />,
  SupportIllustration: () => <div data-testid="support-illustration" />
}))

describe('Home page', () => {
  it('renders hero section and primary CTAs', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )

    expect(screen.getByText(/Check Vehicle Challan/i)).toBeInTheDocument()
    const challanLinks = screen.getAllByRole('link', { name: /Check Challan/i })
    expect(challanLinks[0]).toHaveAttribute('href', '/pay-challan')
    expect(screen.getByRole('link', { name: /Check RC Details/i })).toHaveAttribute('href', '/vehicle-info')
  })

  it('shows trust badge', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )

    expect(screen.getByText("India's Most Trusted Platform")).toBeInTheDocument()
  })
})

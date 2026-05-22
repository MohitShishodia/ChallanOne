import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Badge, { StatusDot } from './Badge'

describe('Badge', () => {
  it('renders status text', () => {
    render(<Badge status="pending" />)
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('renders children when provided', () => {
    render(<Badge status="active">Active User</Badge>)
    expect(screen.getByText('Active User')).toBeInTheDocument()
  })

  it('maps PAID to success badge class', () => {
    render(<Badge status="PAID" />)
    expect(screen.getByText('PAID')).toHaveClass('badge-success')
  })

  it('maps OVERDUE to danger badge class', () => {
    render(<Badge status="OVERDUE" />)
    expect(screen.getByText('OVERDUE')).toHaveClass('badge-danger')
  })

  it('uses custom color when provided', () => {
    render(<Badge color="info">Info</Badge>)
    expect(screen.getByText('Info')).toHaveClass('badge-info')
  })

  it('falls back to gray for unknown status', () => {
    render(<Badge status="unknown_status_xyz" />)
    expect(screen.getByText('unknown_status_xyz')).toHaveClass('badge-gray')
  })
})

describe('StatusDot', () => {
  it('renders a dot element', () => {
    const { container } = render(<StatusDot status="paid" />)
    const dot = container.querySelector('span')
    expect(dot).toBeTruthy()
    expect(dot.style.background).toBeTruthy()
  })
})

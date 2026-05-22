import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatusBadge from './StatusBadge'

describe('StatusBadge', () => {
  it('renders PENDING status', () => {
    render(<StatusBadge status="PENDING" />)
    expect(screen.getByText('PENDING')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toHaveClass('badge-pending')
  })

  it('renders PAID status', () => {
    render(<StatusBadge status="PAID" />)
    expect(screen.getByText('PAID')).toHaveClass('badge-paid')
  })

  it('defaults to PENDING for unknown status', () => {
    render(<StatusBadge status="UNKNOWN" />)
    expect(screen.getByText('UNKNOWN')).toHaveClass('badge-pending')
  })

  it('uppercases lowercase status', () => {
    render(<StatusBadge status="overdue" />)
    expect(screen.getByText('OVERDUE')).toBeInTheDocument()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PrimaryButton from './PrimaryButton'

describe('PrimaryButton', () => {
  it('renders children', () => {
    render(<PrimaryButton>Pay Now</PrimaryButton>)
    expect(screen.getByRole('button', { name: 'Pay Now' })).toBeInTheDocument()
  })

  it('applies btn-primary class', () => {
    render(<PrimaryButton>Submit</PrimaryButton>)
    expect(screen.getByRole('button')).toHaveClass('btn-primary')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<PrimaryButton onClick={onClick}>Click</PrimaryButton>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('supports submit type', () => {
    render(<PrimaryButton type="submit">Submit</PrimaryButton>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})

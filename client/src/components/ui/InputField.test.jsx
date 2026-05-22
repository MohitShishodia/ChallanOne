import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import InputField from './InputField'

describe('InputField', () => {
  it('renders label and input', () => {
    render(<InputField label="Vehicle Number" id="vehicle" placeholder="UP32AB1234" />)
    expect(screen.getByText('Vehicle Number')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('UP32AB1234')).toBeInTheDocument()
  })

  it('renders without label', () => {
    render(<InputField placeholder="Enter value" />)
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument()
  })

  it('passes input props', () => {
    render(<InputField label="Mobile" value="9876543210" readOnly />)
    const input = screen.getByDisplayValue('9876543210')
    expect(input).toHaveAttribute('readonly')
  })
})

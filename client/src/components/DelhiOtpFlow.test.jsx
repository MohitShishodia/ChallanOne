import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DelhiOtpFlow from './DelhiOtpFlow'

describe('DelhiOtpFlow', () => {
  const httpFetch = global.fetch
  const onChallansFound = vi.fn()
  const onBack = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = httpFetch
  })

  it('renders vehicle and mobile input step', () => {
    render(<DelhiOtpFlow onChallansFound={onChallansFound} onBack={onBack} />)

    expect(screen.getByText(/Delhi State Challan/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/DL05CX4567/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/10-digit mobile/i)).toBeInTheDocument()
    expect(screen.getAllByPlaceholderText(/Last 4 digits/i)).toHaveLength(2)
    expect(screen.getByRole('button', { name: /Send OTP/i })).toBeInTheDocument()
  })

  it('limits chassis and engine inputs to 4 characters', async () => {
    const user = userEvent.setup()
    render(<DelhiOtpFlow onChallansFound={onChallansFound} onBack={onBack} />)

    const chassisInput = screen.getAllByPlaceholderText(/Last 4 digits/i)[0]
    await user.type(chassisInput, '123456')
    expect(chassisInput).toHaveValue('1234')
  })

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup()
    render(<DelhiOtpFlow onChallansFound={onChallansFound} onBack={onBack} />)

    await user.click(screen.getByRole('button', { name: /Back to Options/i }))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows OTP step after successful run creation', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        runId: 'run-abc',
        status: 'AWAITING_OTP',
        nextAction: 'SUBMIT_FETCH_OTP',
        nextOtpAction: 'SUBMIT_FETCH_OTP',
        resendAction: 'RESEND_FETCH_OTP',
        cancelAction: 'CANCEL_RUN'
      })
    }))

    const user = userEvent.setup()
    render(<DelhiOtpFlow onChallansFound={onChallansFound} onBack={onBack} />)

    await user.type(screen.getByPlaceholderText(/DL05CX4567/i), 'DL05CX4567')
    await user.type(screen.getByPlaceholderText(/10-digit mobile/i), '9876543210')
    await user.click(screen.getByRole('button', { name: /Send OTP/i }))

    await waitFor(() => {
      expect(screen.getByText(/Enter OTP/i)).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText(/Enter OTP/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Verify OTP/i })).toBeInTheDocument()
  })

  it('shows error when API rejects invalid mobile', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        message: 'Invalid mobile number. Must be a valid 10-digit Indian mobile number.'
      })
    }))

    const user = userEvent.setup()
    render(<DelhiOtpFlow onChallansFound={onChallansFound} onBack={onBack} />)

    await user.type(screen.getByPlaceholderText(/DL05CX4567/i), 'DL05CX4567')
    await user.type(screen.getByPlaceholderText(/10-digit mobile/i), '12345')
    await user.click(screen.getByRole('button', { name: /Send OTP/i }))

    await waitFor(() => {
      expect(screen.getByText(/Invalid mobile number/i)).toBeInTheDocument()
    })
  })
})

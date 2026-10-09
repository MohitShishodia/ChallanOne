import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ChallanSettlement from './ChallanSettlement'

vi.mock('../utils/supportApi', () => ({
  submitSupportMessage: vi.fn(),
}))

import { submitSupportMessage } from '../utils/supportApi'

describe('ChallanSettlement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    submitSupportMessage.mockResolvedValue({ ticketId: 'ticket-12345678' })
  })

  it('submits the RC number and mobile number without email or message fields', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <ChallanSettlement />
      </MemoryRouter>
    )

    await user.type(screen.getByPlaceholderText(/Enter your RC number/i), 'DL01AB1234')
    await user.type(screen.getByPlaceholderText(/10-digit mobile number/i), '9876543210')

    expect(screen.queryByText('Email Address')).not.toBeInTheDocument()
    expect(screen.queryByText('Message', { selector: 'label' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Submit Request' }))

    await waitFor(() => {
      expect(submitSupportMessage).toHaveBeenCalledWith({
        name: 'DL01AB1234',
        mobileNumber: '9876543210',
        source: 'challan-settlement',
      })
    })
  })
})
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PayChallan from './PayChallan'
import { renderWithRouter, mockChallanApiResponse } from '../test/testUtils'

vi.mock('../components/Illustrations', () => ({
  PoliceIllustration: () => <div data-testid="police-illustration" />
}))

vi.mock('../components/DelhiOtpFlow', () => ({
  default: ({ onBack, onChallansFound }) => (
    <div data-testid="delhi-otp-flow">
      <button type="button" onClick={onBack}>Back to Options</button>
      <button
        type="button"
        onClick={() => onChallansFound?.({
          vehicleNumber: 'DL05CX4567',
          challans: [{
            id: 'NT-DL-001',
            noticeId: 'NT-DL-001',
            offenceDetails: 'Red light violation',
            amount: 500,
            status: 'PENDING',
            date: '01 Jan 2024',
            time: '10:00',
            location: 'Delhi',
            displayType: 'E-Challan',
            isCourtChallan: false,
            courtFee: 0
          }]
        })}
      >
        Simulate Delhi Results
      </button>
    </div>
  )
}))

describe('PayChallan page', () => {
  const httpFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    global.fetch = httpFetch
  })

  it('renders flow selector with Delhi and Fetch All options', () => {
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    expect(screen.getByText('Check Challan')).toBeInTheDocument()
    expect(screen.getByText('Delhi State Challan')).toBeInTheDocument()
    expect(screen.getByText('Fetch All Challans')).toBeInTheDocument()
  })

  it('shows Delhi OTP flow when Delhi State Challan is selected', async () => {
    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('Delhi State Challan'))
    expect(screen.getByTestId('delhi-otp-flow')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Delhi State Challan' })).toBeInTheDocument()
  })

  it('shows vehicle search form when Fetch All Challans is selected', async () => {
    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('Fetch All Challans'))
    expect(screen.getByPlaceholderText(/Enter vehicle number/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Check Challan/i })).toBeInTheDocument()
  })

  it('fetches and displays challan results for Fetch All flow', async () => {
    global.fetch = vi.fn(async (url) => {
      if (String(url).includes('/api/external/challan')) {
        return {
          ok: true,
          json: async () => mockChallanApiResponse
        }
      }
      return httpFetch(url)
    })

    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('Fetch All Challans'))
    const input = screen.getByPlaceholderText(/Enter vehicle number/i)
    await user.type(input, 'UP32AB1234')
    await user.click(screen.getByRole('button', { name: /Check Challan/i }))

    await waitFor(() => {
      expect(screen.getByText('Challan Results')).toBeInTheDocument()
    })

    expect(screen.getByText('NT-001')).toBeInTheDocument()
    expect(screen.getByText('Signal violation')).toBeInTheDocument()
    expect(screen.getByText('E-Challan')).toBeInTheDocument()
    expect(screen.getByText(/1 Challan/i)).toBeInTheDocument()
    expect(screen.getByText(/Download All \(PDF\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Powered by/i)).toBeInTheDocument()
  })

  it('shows error when API returns no challans', async () => {
    global.fetch = vi.fn(async (url) => {
      if (String(url).includes('/api/external/challan')) {
        return {
          ok: true,
          json: async () => ({ success: false, message: 'No challans found for vehicle' })
        }
      }
      return httpFetch(url)
    })

    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('Fetch All Challans'))
    await user.type(screen.getByPlaceholderText(/Enter vehicle number/i), 'UP32AB1234')
    await user.click(screen.getByRole('button', { name: /Check Challan/i }))

    await waitFor(() => {
      expect(screen.getByText(/No challans found/i)).toBeInTheDocument()
    })
  })

  it('displays Delhi OTP results when flow completes', async () => {
    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('Delhi State Challan'))
    await user.click(screen.getByRole('button', { name: /Simulate Delhi Results/i }))

    await waitFor(() => {
      expect(screen.getByText('Challan Results')).toBeInTheDocument()
    })

    expect(screen.getByText('Delhi OTP Verified')).toBeInTheDocument()
    expect(screen.getByText('NT-DL-001')).toBeInTheDocument()
  })

  it('returns to flow selector from Delhi OTP back button', async () => {
    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('Delhi State Challan'))
    await user.click(screen.getByRole('button', { name: /Back to Options/i }))

    expect(screen.getByText('Select Challan Check Type')).toBeInTheDocument()
  })

  it('auto-fetches when vehicle query param is present', async () => {
    global.fetch = vi.fn(async (url) => {
      if (String(url).includes('/api/external/challan')) {
        return {
          ok: true,
          json: async () => mockChallanApiResponse
        }
      }
      return httpFetch(url)
    })

    renderWithRouter(<PayChallan />, {
      route: '/pay-challan?vehicle=UP32AB1234',
      path: '/pay-challan'
    })

    await waitFor(() => {
      expect(screen.getByText('Challan Results')).toBeInTheDocument()
    })
  })
})

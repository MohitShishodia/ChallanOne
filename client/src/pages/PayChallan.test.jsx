import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
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
    sessionStorage.clear()
  })

  afterEach(() => {
    global.fetch = httpFetch
  })

  it('renders flow selector with Delhi and Fetch All options', () => {
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    expect(screen.getByText('Fetch All Challans')).toBeInTheDocument()
    expect(screen.getByText('Delhi Challan (OTP Required)')).toBeInTheDocument()
    expect(screen.getByText('Vehicle Search')).toBeInTheDocument()
  })

  it('shows Delhi OTP flow when Delhi State Challan is selected', async () => {
    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('Delhi Challan (OTP Required)'))
    expect(screen.getByTestId('delhi-otp-flow')).toBeInTheDocument()
  })

  it('shows vehicle search form when Fetch All Challans is selected', async () => {
    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('Fetch All Challans'))
    expect(screen.getByPlaceholderText(/DL8CAF1234/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Search$/i })).toBeInTheDocument()
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
    const input = screen.getByPlaceholderText(/DL8CAF1234/i)
    await user.type(input, 'UP32AB1234')
    await user.click(screen.getByRole('button', { name: /^Search$/i }))

    await waitFor(() => {
      expect(screen.getByText('NT-001')).toBeInTheDocument()
    })

    expect(screen.getByText('Signal violation')).toBeInTheDocument()
    expect(screen.getAllByText('Payment Summary').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pay Securely').length).toBeGreaterThan(0)
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
    await user.type(screen.getByPlaceholderText(/DL8CAF1234/i), 'UP32AB1234')
    await user.click(screen.getByRole('button', { name: /^Search$/i }))

    await waitFor(() => {
      expect(screen.getByText(/No challans found/i)).toBeInTheDocument()
    })
  })

  it('displays Delhi OTP results when flow completes', async () => {
    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('Delhi Challan (OTP Required)'))
    await user.click(screen.getByRole('button', { name: /Simulate Delhi Results/i }))

    await waitFor(() => {
      expect(screen.getByText('NT-DL-001')).toBeInTheDocument()
    })

    expect(screen.getByText(/Delhi OTP Verified/i)).toBeInTheDocument()
  })

  it('returns to Fetch All from Delhi OTP back button', async () => {
    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('Delhi Challan (OTP Required)'))
    await user.click(screen.getByRole('button', { name: /Back to Options/i }))

    expect(screen.getByRole('button', { name: /^Search$/i })).toBeInTheDocument()
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
      expect(screen.getByText('NT-001')).toBeInTheDocument()
    })
  })

  it('restores cached challan data when returning to the page', async () => {
    sessionStorage.setItem(
      'challanone_check_challan_state',
      JSON.stringify({
        data: {
          success: true,
          dataSource: 'EXTERNAL',
          vehicle: {
            number: 'UP32AB1234',
            owner: 'Test Owner',
            vehicleType: 'Private Vehicle',
            isVerified: true,
          },
          challans: [{
            id: 'NT-001',
            noticeId: 'NT-001',
            offenceDetails: 'Signal violation',
            amount: 500,
            status: 'PENDING',
            date: '01 May 2024',
            time: '10:00',
            location: 'Lucknow',
            displayType: 'E-Challan',
            isCourtChallan: false,
            courtFee: 0,
          }],
          pendingCount: 1,
          paidCount: 0,
        },
        vehicleNumber: 'UP32AB1234',
        flowType: 'ALL_CHALLANS',
        selectedChallans: ['NT-001'],
        filters: {
          activeTab: 'all',
          selectedState: 'all',
          searchQuery: '',
          courtFilter: 'all',
          dateFilter: 'all',
          sortBy: 'newest',
          page: 1,
        },
        fetchedAt: Date.now(),
      })
    )

    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    expect(screen.getByText('NT-001')).toBeInTheDocument()
    expect(screen.getByText('Signal violation')).toBeInTheDocument()
    expect(screen.getByText('Test Owner')).toBeInTheDocument()
    expect(screen.getAllByText('Payment Summary').length).toBeGreaterThan(0)
  })

  it('opens Delhi OTP flow even when Fetch All results are visible', async () => {
    sessionStorage.setItem(
      'challanone_check_challan_state',
      JSON.stringify({
        data: {
          success: true,
          dataSource: 'EXTERNAL',
          vehicle: {
            number: 'UP32AB1234',
            owner: 'Test Owner',
            vehicleType: 'Private Vehicle',
            isVerified: true,
          },
          challans: [{
            id: 'NT-001',
            noticeId: 'NT-001',
            offenceDetails: 'Signal violation',
            amount: 500,
            status: 'PENDING',
            date: '01 May 2024',
            time: '10:00',
            location: 'Lucknow',
            displayType: 'E-Challan',
            isCourtChallan: false,
            courtFee: 0,
          }],
          pendingCount: 1,
          paidCount: 0,
        },
        vehicleNumber: 'UP32AB1234',
        flowType: 'ALL_CHALLANS',
        selectedChallans: [],
        filters: {
          activeTab: 'all',
          selectedState: 'all',
          searchQuery: '',
          courtFilter: 'all',
          dateFilter: 'all',
          sortBy: 'newest',
          page: 1,
        },
        fetchedAt: Date.now(),
      })
    )

    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    expect(screen.getByText('NT-001')).toBeInTheDocument()

    await user.click(screen.getByText('Delhi Challan (OTP Required)'))

    expect(screen.getByTestId('delhi-otp-flow')).toBeInTheDocument()
    expect(screen.queryByText('NT-001')).not.toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PayChallan from './PayChallan'
import { renderWithRouter, mockChallanApiResponse } from '../test/testUtils'

vi.mock('../components/Illustrations', () => ({
  PoliceIllustration: () => <div data-testid="police-illustration" />
}))

vi.mock('../components/DelhiOtpFlow', () => ({
  default: ({ onBack, onChallansFound, initialRun }) => (
    <div data-testid="delhi-otp-flow">
      {initialRun && <span>Delhi verification started</span>}
      <button type="button" onClick={onBack}>Back to Options</button>
      <button
        type="button"
        onClick={() => onChallansFound?.({
          vehicleNumber: 'DL05CX4567',
          challans: [
            {
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
              courtFee: 0
            },
            {
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
            }
          ]
        })}
      >
        Simulate Delhi Results
      </button>
      <button
        type="button"
        onClick={() => onChallansFound?.({ vehicleNumber: 'DL05CX4567', challans: [] })}
      >
        Simulate Empty Delhi Results
      </button>
    </div>
  )
}))

const mockDelhiRun = {
  success: true,
  runId: 'run-123',
  nextAction: 'SUBMIT_FETCH_OTP',
  nextOtpAction: 'SUBMIT_FETCH_OTP'
}

describe('PayChallan page', () => {
  const httpFetch = globalThis.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    globalThis.fetch = httpFetch
  })

  it('renders all three challan sources', () => {
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    expect(screen.getByText('All Challans (Recommended)')).toBeInTheDocument()
    expect(screen.getByText('e-Challan / Parivahan')).toBeInTheDocument()
    expect(screen.getByText('Delhi Traffic Challans')).toBeInTheDocument()
    expect(screen.getByText('Vehicle Search')).toBeInTheDocument()
  })

  it('shows Delhi OTP flow when Delhi State Challan is selected', async () => {
    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('Delhi Traffic Challans'))
    expect(screen.getByTestId('delhi-otp-flow')).toBeInTheDocument()
  })

  it('shows vehicle search form when All Challans is selected', async () => {
    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('All Challans (Recommended)'))
    expect(screen.getByPlaceholderText(/DL8CAF1234/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/10-digit mobile number/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Search All Challans/i })).toBeInTheDocument()
  })

  it('fetches e-Challan/Parivahan only when that source is selected', async () => {
    globalThis.fetch = vi.fn(async (url) => {
      if (String(url).includes('/api/external/challan')) {
        return { ok: true, json: async () => mockChallanApiResponse }
      }
      return httpFetch(url)
    })

    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, {
      route: '/pay-challan?vehicle=UP32AB1234&source=external',
      path: '/pay-challan'
    })

    expect(screen.queryByPlaceholderText(/10-digit mobile number/i)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Search e-Challan/i }))

    await waitFor(() => {
      expect(screen.getByText('NT-001')).toBeInTheDocument()
    })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/external/challan'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/delhi-otp/runs'),
      expect.anything()
    )
  })

  it('starts both sources together and combines their challans after Delhi OTP', async () => {
    globalThis.fetch = vi.fn(async (url) => {
      if (String(url).includes('/api/external/challan')) {
        return {
          ok: true,
          json: async () => mockChallanApiResponse
        }
      }
      if (String(url).includes('/api/delhi-otp/runs')) {
        return { ok: true, json: async () => mockDelhiRun }
      }
      return httpFetch(url)
    })

    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('All Challans (Recommended)'))
    const input = screen.getByPlaceholderText(/DL8CAF1234/i)
    await user.type(input, 'UP32AB1234')
    await user.type(screen.getByPlaceholderText(/10-digit mobile number/i), '9876543210')
    await user.click(screen.getByRole('button', { name: /Search All Challans/i }))

    await waitFor(() => {
      expect(screen.getByText('Delhi verification started')).toBeInTheDocument()
    })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/external/challan'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/delhi-otp/runs'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ vehicleNumber: 'UP32AB1234', mobileNumber: '9876543210' })
      })
    )

    await user.click(screen.getByRole('button', { name: /Simulate Delhi Results/i }))
    expect(screen.getByText('NT-001')).toBeInTheDocument()
    expect(screen.getByText('NT-DL-001')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox', { name: 'Select challan NT-001' })).toHaveLength(1)
    expect(screen.getByText('Signal violation')).toBeInTheDocument()
    expect(screen.getAllByText('Payment Summary').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pay Securely').length).toBeGreaterThan(0)
  })

  it('shows an error when both sources return no challans', async () => {
    globalThis.fetch = vi.fn(async (url) => {
      if (String(url).includes('/api/external/challan')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            vehicleNumber: 'UP32AB1234',
            data: { pendingChallans: [], paidChallans: [], disposedChallans: [] }
          })
        }
      }
      if (String(url).includes('/api/delhi-otp/runs')) {
        return { ok: true, json: async () => mockDelhiRun }
      }
      return httpFetch(url)
    })

    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('All Challans (Recommended)'))
    await user.type(screen.getByPlaceholderText(/DL8CAF1234/i), 'UP32AB1234')
    await user.type(screen.getByPlaceholderText(/10-digit mobile number/i), '9876543210')
    await user.click(screen.getByRole('button', { name: /Search All Challans/i }))

    await user.click(await screen.findByRole('button', { name: /Simulate Empty Delhi Results/i }))
    await waitFor(() => {
      expect(screen.getByText(/No challans found from either source/i)).toBeInTheDocument()
    })
  })

  it('displays Delhi OTP results when flow completes', async () => {
    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('Delhi Traffic Challans'))
    await user.click(screen.getByRole('button', { name: /Simulate Delhi Results/i }))

    await waitFor(() => {
      expect(screen.getByText('NT-DL-001')).toBeInTheDocument()
    })

    expect(screen.getByText(/Delhi OTP Verified/i)).toBeInTheDocument()
  })

  it('returns to Fetch All from Delhi OTP back button', async () => {
    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, { route: '/pay-challan', path: '/pay-challan' })

    await user.click(screen.getByText('Delhi Traffic Challans'))
    await user.click(screen.getByRole('button', { name: /Back to Options/i }))

    expect(screen.getByRole('button', { name: /Search All Challans/i })).toBeInTheDocument()
  })

  it('prefills vehicle from query without skipping required mobile verification', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    renderWithRouter(<PayChallan />, {
      route: '/pay-challan?vehicle=UP32AB1234',
      path: '/pay-challan'
    })

    expect(screen.getByDisplayValue('UP32AB1234')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/10-digit mobile number/i)).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/external/challan'),
      expect.anything()
    )
  })

  it('starts both sources when homepage submits vehicle and mobile for All Challans', async () => {
    globalThis.fetch = vi.fn(async (url) => {
      if (String(url).includes('/api/external/challan')) {
        return { ok: true, json: async () => mockChallanApiResponse }
      }
      if (String(url).includes('/api/delhi-otp/runs')) {
        return { ok: true, json: async () => mockDelhiRun }
      }
      return httpFetch(url)
    })

    renderWithRouter(<PayChallan />, {
      route: {
        pathname: '/pay-challan',
        search: '?vehicle=UP32AB1234&source=all',
        state: { mobileNumber: '9876543210' }
      },
      path: '/pay-challan'
    })

    await waitFor(() => {
      expect(screen.getByText('Delhi verification started')).toBeInTheDocument()
    })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/delhi-otp/runs'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ vehicleNumber: 'UP32AB1234', mobileNumber: '9876543210' })
      })
    )
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/external/challan'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('fetches fresh challan data instead of restoring cache', async () => {
    globalThis.fetch = vi.fn((url, options) => {
      if (String(url).includes('/api/external/challan')) {
        const body = JSON.parse(options?.body || '{}')
        expect(body.bypassCache).toBe(true)
        return Promise.resolve({
          ok: true,
          json: async () => mockChallanApiResponse,
        })
      }
      if (String(url).includes('/api/delhi-otp/runs')) {
        return Promise.resolve({ ok: true, json: async () => mockDelhiRun })
      }
      return httpFetch(url, options)
    })

    const user = userEvent.setup()
    renderWithRouter(<PayChallan />, {
      route: '/pay-challan?vehicle=UP32AB1234',
      path: '/pay-challan',
    })

    await user.type(screen.getByPlaceholderText(/10-digit mobile number/i), '9876543210')
    await user.click(screen.getByRole('button', { name: /Search All Challans/i }))
    await waitFor(() => {
      expect(screen.getByText('Delhi verification started')).toBeInTheDocument()
    })
    expect(globalThis.fetch).toHaveBeenCalled()
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

    await user.click(screen.getByText('Delhi Traffic Challans'))

    expect(screen.getByTestId('delhi-otp-flow')).toBeInTheDocument()
    expect(screen.queryByText('NT-001')).not.toBeInTheDocument()
  })
})

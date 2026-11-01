import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import HeroSearchWidget from './HeroSearchWidget'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Test User' } })
}))

afterEach(() => {
  vi.unstubAllGlobals()
})

function CombinedResultsRoute() {
  const { state } = useLocation()
  const result = state?.challanSearchResult

  return (
    <section>
      <h1>Challan Results</h1>
      <p>{result?.vehicle.number}</p>
      <p>{result?.dataSource}</p>
      {result?.challans.map((challan) => (
        <p key={challan.noticeId}>{challan.noticeId}</p>
      ))}
    </section>
  )
}

describe('HeroSearchWidget challan sources', () => {
  it('offers all three challan sources and asks for a mobile for combined search', () => {
    render(
      <MemoryRouter>
        <HeroSearchWidget />
      </MemoryRouter>
    )

    const sourceSelector = screen.getByRole('combobox', { name: 'Choose Challans' })
    expect(sourceSelector).toHaveTextContent('Delhi Traffic Challans')
    expect(sourceSelector).toHaveTextContent('e-Challan / Parivahan')
    expect(sourceSelector).toHaveTextContent('All Challans (Recommended)')
    expect(screen.getByLabelText('Registered Mobile Number *')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Fetch All & Send OTP/i })).toBeInTheDocument()
  })

  it('fetches both sources, verifies OTP, and navigates to combined results', async () => {
    let resolveExternalRequest
    const externalResponse = new Promise((resolve) => {
      resolveExternalRequest = resolve
    })
    const fetchMock = vi.fn(async (url, options = {}) => {
      if (String(url).includes('/api/external/challan')) {
        return externalResponse
      }

      if (String(url).endsWith('/api/delhi-otp/runs')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            runId: 'run-home-1',
            nextAction: 'SUBMIT_FETCH_OTP',
            nextOtpAction: 'SUBMIT_FETCH_OTP'
          })
        }
      }

      if (String(url).endsWith('/api/delhi-otp/runs/run-home-1/actions')) {
        expect(JSON.parse(options.body)).toEqual({
          action: 'SUBMIT_FETCH_OTP',
          payload: { otp: '123456' }
        })
        return {
          ok: true,
          json: async () => ({
            success: true,
            vehicleNumber: 'UP32AB1234',
            isTerminal: true,
            status: 'COMPLETED',
            challans: [{
              id: 'DL-1',
              noticeId: 'DL-1',
              status: 'PENDING',
              amount: 1000,
              offenceDetails: 'Red light violation',
              location: 'Delhi',
              date: '30 Oct 2026'
            }]
          })
        }
      }

      throw new Error(`Unexpected request: ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<HeroSearchWidget />} />
          <Route path="/pay-challan" element={<CombinedResultsRoute />} />
        </Routes>
      </MemoryRouter>
    )

    await user.type(screen.getByPlaceholderText(/Enter Vehicle Number/i), 'UP32AB1234')
    await user.type(screen.getByLabelText('Registered Mobile Number *'), '9876543210')
    await user.click(screen.getByRole('button', { name: /Fetch All & Send OTP/i }))

    expect(await screen.findByPlaceholderText('Enter OTP')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/external/challan'),
      expect.objectContaining({ method: 'POST' })
    )

    await user.type(screen.getByPlaceholderText('Enter OTP'), '123456')
    await user.click(screen.getByRole('button', { name: 'Verify OTP' }))
    expect(screen.getByText('Fetching all challans and sending OTP...')).toBeInTheDocument()
    expect(screen.queryByText('Challan Results')).not.toBeInTheDocument()

    resolveExternalRequest({
      ok: true,
      json: async () => ({
        success: true,
        source: 'CHALLANWALA',
        vehicleNumber: 'UP32AB1234',
        data: {
          pendingChallans: [{
            noticeNumber: 'EXT-1',
            amount: 500,
            challanStatus: 'pending',
            offenseDetails: 'Signal violation',
            challanPlace: 'Lucknow',
            challanDate: '2026-10-30'
          }],
          paidChallans: [],
          disposedChallans: []
        }
      })
    })

    expect(await screen.findByText('Challan Results')).toBeInTheDocument()
    expect(screen.getByText('COMBINED')).toBeInTheDocument()
    expect(screen.getByText('UP32AB1234')).toBeInTheDocument()
    expect(screen.getByText('EXT-1')).toBeInTheDocument()
    expect(screen.getByText('DL-1')).toBeInTheDocument()
  })
})

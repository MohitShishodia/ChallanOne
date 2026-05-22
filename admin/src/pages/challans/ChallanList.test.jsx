import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent, within } from '@testing-library/react'
import ChallanList from './ChallanList'
import { renderWithAdmin, mockChallanListResponse } from '../../test/testUtils'

const mockRefetch = vi.fn()
const mockRequest = vi.fn()

vi.mock('../../hooks/useFetch', () => ({
  useFetch: vi.fn(),
  useApi: vi.fn(() => ({
    request: mockRequest,
    loading: false
  }))
}))

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

import { useFetch } from '../../hooks/useFetch'

describe('ChallanList page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useFetch.mockReturnValue({
      data: mockChallanListResponse,
      loading: false,
      error: null,
      refetch: mockRefetch
    })
  })

  it('renders page title and challan table data', () => {
    renderWithAdmin(<ChallanList />)

    expect(screen.getByText('Challan Management')).toBeInTheDocument()
    expect(screen.getByText(/View and manage all traffic challans/i)).toBeInTheDocument()
    expect(screen.getByText('DL-2024-100')).toBeInTheDocument()
    expect(screen.getByText('UP-2024-200')).toBeInTheDocument()
  })

  it('renders search and filter controls', () => {
    renderWithAdmin(<ChallanList />)

    expect(screen.getByPlaceholderText(/Search challan/i)).toBeInTheDocument()
    expect(screen.getByText('All Statuses')).toBeInTheDocument()
  })

  it('calls refetch when refresh button is clicked', () => {
    renderWithAdmin(<ChallanList />)

    fireEvent.click(screen.getByRole('button', { name: /Refresh/i }))
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('shows empty state when no challans', () => {
    useFetch.mockReturnValue({
      data: { success: true, challans: [], pagination: { page: 1, total: 0, totalPages: 0, limit: 20 } },
      loading: false,
      error: null,
      refetch: mockRefetch
    })

    renderWithAdmin(<ChallanList />)
    expect(screen.getByText('No challans found')).toBeInTheDocument()
  })

  it('opens detail modal when view action is clicked', async () => {
    renderWithAdmin(<ChallanList />)

    const viewButtons = screen.getAllByTitle('View & update')
    fireEvent.click(viewButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Challan: DL-2024-100/i)).toBeInTheDocument()
    })

    const modal = document.querySelector('.modal')
    expect(modal).toBeTruthy()
    const modalScope = within(modal)

    expect(modalScope.getByText('Update Status')).toBeInTheDocument()
    expect(modalScope.getByText('DL05CX4567')).toBeInTheDocument()
    expect(modalScope.getByText('Rahul Sharma')).toBeInTheDocument()
  })

  it('updates challan status via API', async () => {
    mockRequest.mockResolvedValue({ success: true, message: 'Updated' })

    renderWithAdmin(<ChallanList />)

    const viewButtons = screen.getAllByTitle('View & update')
    fireEvent.click(viewButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Update Status')).toBeInTheDocument()
    })

    const paidButtons = screen.getAllByRole('button', { name: 'PAID' })
    fireEvent.click(paidButtons[paidButtons.length - 1])

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith(
        '/api/admin/challans/ch-1/status',
        expect.objectContaining({ method: 'PATCH', body: { status: 'PAID' } })
      )
    })
  })

  it('shows loading skeleton when loading', () => {
    useFetch.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: mockRefetch
    })

    const { container } = renderWithAdmin(<ChallanList />)
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
  })
})

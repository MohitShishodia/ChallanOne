import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import Dashboard from './Dashboard'
import { renderWithAdmin, mockDashboardStats } from '../test/testUtils'

vi.mock('recharts', () => import('../test/mocks/recharts.jsx'))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    admin: { id: '1', name: 'Admin' },
    authHeaders: () => ({ Authorization: 'Bearer test-token' }),
    loading: false
  })
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})

describe('Dashboard page', () => {
  const httpFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = httpFetch
  })

  function mockDashboardFetch() {
    global.fetch = vi.fn(async (url) => {
      const path = String(url)
      if (path.includes('/dashboard/stats')) {
        return { ok: true, json: async () => mockDashboardStats }
      }
      if (path.includes('/dashboard/revenue-chart')) {
        return { ok: true, json: async () => ({ success: true, data: [{ month: 'Jan', revenue: 10000, payments: 50 }] }) }
      }
      if (path.includes('/dashboard/challan-stats')) {
        return { ok: true, json: async () => ({ success: true, stats: { PENDING: 10, OVERDUE: 5, PAID: 100 } }) }
      }
      if (path.includes('/dashboard/recent-activity')) {
        return { ok: true, json: async () => ({ success: true, activity: [{ id: '1', action: 'admin_login', createdAt: new Date().toISOString() }] }) }
      }
      return httpFetch(url)
    })
  }

  it('renders dashboard title', async () => {
    mockDashboardFetch()
    renderWithAdmin(<Dashboard />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText(/platform overview/i)).toBeInTheDocument()
  })

  it('loads and displays stat cards', async () => {
    mockDashboardFetch()
    renderWithAdmin(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument()
    })

    expect(screen.getByText('Total Payments')).toBeInTheDocument()
    expect(screen.getByText('Pending Challans')).toBeInTheDocument()
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
  })

  it('renders chart containers after data loads', async () => {
    mockDashboardFetch()
    renderWithAdmin(<Dashboard />)

    await waitFor(() => {
      expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0)
    })
  })

  it('shows recent activity section', async () => {
    mockDashboardFetch()
    renderWithAdmin(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument()
    })
  })
})

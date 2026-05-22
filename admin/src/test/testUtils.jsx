import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

export function renderWithAdmin(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  )
}

export const mockDashboardStats = {
  success: true,
  stats: {
    totalUsers: 1200,
    totalPayments: 450,
    pendingChallans: 89,
    totalRevenue: 250000
  }
}

export const mockChallanListResponse = {
  success: true,
  challans: [
    {
      id: 'ch-1',
      challanNumber: 'DL-2024-100',
      vehicleNumber: 'DL05CX4567',
      violationType: 'Red Light',
      amount: 500,
      status: 'PENDING',
      fineDate: '2024-03-15',
      location: 'ITO Delhi',
      ownerName: 'Rahul Sharma',
      issuedBy: 'Delhi Traffic'
    },
    {
      id: 'ch-2',
      challanNumber: 'UP-2024-200',
      vehicleNumber: 'UP32AB1234',
      violationType: 'Overspeed',
      amount: 1000,
      status: 'PAID',
      fineDate: '2024-02-10',
      location: 'Lucknow',
      ownerName: 'Amit Kumar',
      issuedBy: 'UP Police'
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 2,
    totalPages: 1
  }
}

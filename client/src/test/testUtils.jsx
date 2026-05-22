import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'

export function renderWithRouter(ui, { route = '/', path = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )
}

export function renderWithAuth(ui, user = null) {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('authToken', 'test-token')
  } else {
    localStorage.removeItem('user')
    localStorage.removeItem('authToken')
  }

  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  )
}

export const mockChallanApiResponse = {
  success: true,
  source: 'CHALLANWALA',
  vehicleNumber: 'UP32AB1234',
  data: {
    pendingChallans: [
      {
        challanNumber: 'CH-001',
        amount: 500,
        challanStatus: 'pending',
        challanType: 'ONLINE',
        challanPlace: 'Lucknow',
        challanDate: '2024-05-01T10:00:00',
        sentToVirtualCourt: false,
        courtChallan: false,
        accusedName: 'Test Owner'
      }
    ],
    paidChallans: [],
    disposedChallans: []
  }
}

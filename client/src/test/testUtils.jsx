import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { FeatureProvider } from '../context/FeatureContext'

export function renderWithRouter(ui, { route = '/', path = '/', state = null } = {}) {
  const initialEntry = typeof route === 'string'
    ? {
        pathname: route.split('?')[0],
        search: route.includes('?') ? `?${route.split('?')[1]}` : '',
        state
      }
    : route

  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <FeatureProvider>
          <Routes>
            <Route path={path} element={ui} />
          </Routes>
        </FeatureProvider>
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
        noticeNumber: 'NT-001',
        challanNumber: 'CH-001',
        amount: 500,
        challanStatus: 'pending',
        challanType: 'ONLINE',
        challanPlace: 'Lucknow',
        challanDate: '2024-05-01T10:00:00',
        offenseDetails: 'Signal violation',
        sentToVirtualCourt: false,
        courtChallan: false,
        courtName: null,
        courtAddress: null,
        accusedName: 'Test Owner'
      }
    ],
    paidChallans: [],
    disposedChallans: []
  }
}

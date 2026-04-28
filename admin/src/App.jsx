// Main App - Routes and auth guards
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import AdminLayout from './components/layout/AdminLayout'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CustomerList from './pages/customers/CustomerList'
import ChallanList from './pages/challans/ChallanList'
import PaymentList from './pages/payments/PaymentList'
import ServiceList from './pages/services/ServiceList'
import Reports from './pages/reports/Reports'
import CMS from './pages/cms/CMS'
import TicketList from './pages/tickets/TicketList'
import Notifications from './pages/notifications/Notifications'
import RoleList from './pages/roles/RoleList'
import Settings from './pages/settings/Settings'

// Protected route guard
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-surface-2)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{
            width: 48, height: 48,
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            Loading admin panel…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <AdminLayout>{children}</AdminLayout>
}

// Guest route (redirect to dashboard if already logged in)
function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        <GuestRoute><Login /></GuestRoute>
      } />

      {/* Protected admin routes */}
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/customers" element={<RequireAuth><CustomerList /></RequireAuth>} />
      <Route path="/challans" element={<RequireAuth><ChallanList /></RequireAuth>} />
      <Route path="/payments" element={<RequireAuth><PaymentList /></RequireAuth>} />
      <Route path="/services" element={<RequireAuth><ServiceList /></RequireAuth>} />
      <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
      <Route path="/cms" element={<RequireAuth><CMS /></RequireAuth>} />
      <Route path="/tickets" element={<RequireAuth><TicketList /></RequireAuth>} />
      <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
      <Route path="/roles" element={<RequireAuth><RoleList /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import WhatsAppButton from './components/ui/WhatsAppButton'
import Home from './pages/Home'
import PayChallan from './pages/PayChallan'
import Support from './pages/Support'
import Login from './pages/Login'
import Profile from './pages/Profile'
import PaymentSuccess from './pages/PaymentSuccess'
import VehicleInfo from './pages/VehicleInfo'
import History from './pages/History'
import './App.css'

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pay-challan" element={
            <ProtectedRoute>
              <PayChallan />
            </ProtectedRoute>
          } />
          <Route path="/vehicle-info" element={
            <ProtectedRoute>
              <VehicleInfo />
            </ProtectedRoute>
          } />
          <Route path="/support" element={<Support />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/history" element={<History />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
        </Routes>
        <WhatsAppButton />
      </AppShell>
    </Router>
  )
}

export default App

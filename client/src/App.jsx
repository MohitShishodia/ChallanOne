import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FeatureProvider } from './context/FeatureContext'
import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'
import WhatsAppButton from './components/ui/WhatsAppButton'
import Home from './pages/Home'
import PayChallan from './pages/PayChallan'
import Support from './pages/Support'
import Login from './pages/Login'
import Profile from './pages/Profile'
import PaymentSuccess from './pages/PaymentSuccess'
import History from './pages/History'
import About from './pages/About'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import ServiceHistory from './pages/ServiceHistory'
import RCDetails from './pages/RCDetails'
import VehicleInfo from './pages/VehicleInfo'
import ChallanSettlement from './pages/ChallanSettlement'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <FeatureProvider>
      <Router>
        <Routes>
          {/* All routes use the default AppShell (Navbar + Footer) */}
          <Route path="*" element={
            <AppShell>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/rc-details" element={<RCDetails />} />
                <Route path="/pay-challan" element={
                  <ProtectedRoute>
                    <PayChallan />
                  </ProtectedRoute>
                } />
                <Route path="/vehicle-info" element={<VehicleInfo />} />
                <Route path="/support" element={<Support />} />
                <Route path="/challan-settlement" element={<ChallanSettlement />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/history" element={<History />} />
                <Route path="/service-history" element={<ServiceHistory />} />
                <Route path="/about" element={<About />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
              </Routes>
              <WhatsAppButton />
            </AppShell>
          } />
        </Routes>
      </Router>
      </FeatureProvider>
    </AuthProvider>
  )
}

export default App

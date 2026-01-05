import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import TrackChallan from './pages/TrackChallan'
import PayChallan from './pages/PayChallan'
import Support from './pages/Support'
import Login from './pages/Login'
import Profile from './pages/Profile'
import PaymentSuccess from './pages/PaymentSuccess'
import VehicleInfo from './pages/VehicleInfo'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pay-challan" element={
              <ProtectedRoute>
                <PayChallan />
              </ProtectedRoute>
            } />
            <Route path="/track-challan" element={
              <ProtectedRoute>
                <TrackChallan />
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
            <Route path="/payment-success" element={<PaymentSuccess />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App

import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageHeader from './PageHeader'

export default function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) {
    return (
      <div className="screen">
        <PageHeader title="Login Required" />
        <div className="screen-content flex flex-col items-center justify-center text-center pt-12">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="h-display">Sign in to continue</h2>
          <p className="mt-2 max-w-xs text-[14px] text-slate-500">
            Login or create an account to check challans, view RC details and pay securely.
          </p>
          <div className="mt-6 w-full space-y-3">
            <button
              onClick={() => navigate('/login', { state: { from: location.pathname } })}
              className="btn-primary"
            >
              Login / Sign Up
            </button>
            <button onClick={() => navigate('/')} className="btn-secondary">
              Go to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}

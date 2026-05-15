import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

const readUser = () => {
  if (typeof window === 'undefined') return null
  const storedUser = window.localStorage.getItem('user')
  if (!storedUser) return null
  try { return JSON.parse(storedUser) } catch { return null }
}

export default function Profile() {
  const [user] = useState(readUser)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('userLogout'))
    navigate('/')
  }

  if (!user) {
    return (
      <div className="screen">
        <PageHeader title="Profile" />
        <div className="screen-content flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        </div>
      </div>
    )
  }

  const initial = (user.name || user.email || user.phone || 'U').charAt(0).toUpperCase()

  return (
    <div className="screen">
      <PageHeader title="Profile" />

      <div className="screen-content">
        <div className="container-narrow py-8 md:py-12 space-y-6">
          <div className="surface-card p-6 md:p-8 text-center animate-fade-up bg-gradient-to-br from-blue-600 to-blue-800 border-blue-700">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-blue-600 text-3xl font-bold shadow-md">
              {initial}
            </div>
            <h2 className="mt-3 text-[22px] font-bold text-white">{user.name || 'User'}</h2>
            <p className="text-[14px] text-blue-100">{user.email || user.phone}</p>
            <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-semibold text-white">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
              Verified Account
            </span>
          </div>

          <div className="surface-card p-5 md:p-6 animate-fade-up">
            <h3 className="h-section">Account Information</h3>
            <div className="mt-3 divide-y divide-slate-100">
              <Field label="Full Name" value={user.name || 'Not Provided'} />
              <Field label="Email" value={user.email || 'Not Provided'} />
              <Field label="Mobile" value={user.phone ? `+91 ${user.phone}` : 'Not Provided'} />
              <Field
                label="Member Since"
                value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Recently Joined'}
              />
            </div>
          </div>

          <div className="surface-card p-2 animate-fade-up">
            <ProfileLink to="/history" title="Search History" desc="View your recent challan and RC lookups" tone="blue" />
            <ProfileLink to="/support" title="Help & Support" desc="Contact our help center" tone="emerald" />
          </div>

          <button onClick={handleLogout} className="btn-secondary border-rose-100 text-rose-600 hover:bg-rose-50 w-full">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-[13.5px] font-semibold text-slate-900 max-w-[60%] truncate text-right">{value}</span>
    </div>
  )
}

function ProfileLink({ to, title, desc, tone }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-slate-900">{title}</p>
        <p className="text-[12px] text-slate-500 truncate">{desc}</p>
      </div>
      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

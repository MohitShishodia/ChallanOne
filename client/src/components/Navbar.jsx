import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import BrandLogo from './BrandLogo'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/pay-challan', label: 'Check Challan' },
  { to: '/vehicle-info', label: 'RC Details' },
  { to: '/service-history', label: 'Service History' },
  { to: '/about', label: 'About Us' },
  { to: '/support', label: 'Support' },
]

export default function Navbar() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    setMobileOpen(false)
    navigate('/')
  }

  const isActive = (path) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <>
      <nav className="site-navbar">
        <div className="site-navbar-inner">
          <BrandLogo />

          <div className="nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link ${isActive(link.to) ? 'nav-link-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-[14px] font-medium text-slate-700 transition hover:bg-slate-50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-brand-red text-[13px] font-bold">
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="max-w-[120px] truncate">{user.name || user.email || user.phone}</span>
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-slate-100 bg-white p-1.5 shadow-xl shadow-slate-900/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link to="/profile" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21a8 8 0 0116 0" />
                    </svg>
                    My Profile
                  </Link>
                  <Link to="/service-history" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Service History
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-rose-600 hover:bg-rose-50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn-primary">
                Login
              </Link>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="mobile-menu-btn"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <>
          <div className="mobile-drawer-overlay" onClick={() => setMobileOpen(false)} />
          <div className="mobile-drawer">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <BrandLogo linkTo="/" />
              <button onClick={() => setMobileOpen(false)} className="icon-btn" aria-label="Close menu">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-3 space-y-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition ${
                    isActive(link.to)
                      ? 'bg-red-50 text-brand-red'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-slate-100 p-3 mt-2">
              {user ? (
                <>
                  <div className="px-4 py-2 text-[12px] text-slate-500">
                    Signed in as <span className="font-semibold text-slate-900">{user.name || user.email || user.phone}</span>
                  </div>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-slate-700 hover:bg-slate-50">
                    My Profile
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-rose-600 hover:bg-rose-50">
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary w-full mt-1">
                  Login / Sign Up
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

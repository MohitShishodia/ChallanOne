import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
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

  const closeMenu = () => setMobileOpen(false)

  useEffect(() => {
    closeMenu()
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return

    const scrollY = window.scrollY
    const prevOverflow = document.body.style.overflow
    const prevPosition = document.body.style.position
    const prevTop = document.body.style.top
    const prevWidth = document.body.style.width

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.overflow = prevOverflow
      document.body.style.position = prevPosition
      document.body.style.top = prevTop
      document.body.style.width = prevWidth
      window.scrollTo(0, scrollY)
    }
  }, [mobileOpen])

  const handleLogout = () => {
    logout()
    closeMenu()
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
          <BrandLogo showText={false} />

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
                <button type="button" className="flex items-center gap-2 rounded-xl px-3 py-2 text-[14px] font-medium text-slate-700 transition hover:bg-slate-50">
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
                    My Profile
                  </Link>
                  <Link to="/service-history" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
                    Service History
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-medium text-rose-600 hover:bg-rose-50">
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
            type="button"
            onClick={() => setMobileOpen(true)}
            className="mobile-menu-btn"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="mobile-menu-root" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div
            className="mobile-drawer-overlay"
            onClick={closeMenu}
            onTouchEnd={closeMenu}
            aria-hidden="true"
          />
          <div className="mobile-drawer">
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <Link to="/" onClick={closeMenu}>
                <BrandLogo linkTo={null} size="sm" />
              </Link>
              <button type="button" onClick={closeMenu} className="icon-btn" aria-label="Close menu">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-2 space-y-0.5 overflow-y-auto flex-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-medium transition ${
                    isActive(link.to)
                      ? 'bg-red-50 text-brand-red'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-slate-100 p-2 shrink-0">
              {user ? (
                <>
                  <div className="px-4 py-1.5 text-[11px] text-slate-500 truncate">
                    Signed in as <span className="font-semibold text-slate-900">{user.name || user.email}</span>
                  </div>
                  <Link to="/profile" onClick={closeMenu} className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-700 hover:bg-slate-50">
                    My Profile
                  </Link>
                  <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] font-medium text-rose-600 hover:bg-rose-50">
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={closeMenu} className="btn-primary w-full mt-1">
                  Login / Sign Up
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function TopBar() {
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const sync = () => {
      const u = localStorage.getItem('user')
      setUser(u ? JSON.parse(u) : null)
    }
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener('userLogout', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('userLogout', sync)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('userLogout'))
    setMenuOpen(false)
    navigate('/')
  }

  return (
    <header className="top-bar">
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-md shadow-blue-600/30">
          <svg className="h-4.5 w-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <span className="text-[17px] font-bold tracking-tight text-slate-900">
          Challan<span className="text-blue-600">One</span>
        </span>
      </Link>

      <div className="flex items-center gap-1 relative">
        <button className="icon-btn" aria-label="Notifications">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.17V11a6 6 0 10-12 0v3.17a2 2 0 01-.6 1.43L4 17h5m6 0a3 3 0 11-6 0" />
          </svg>
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
        <button onClick={() => setMenuOpen(v => !v)} className="icon-btn" aria-label="Menu">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-900/5">
            {user ? (
              <>
                <div className="px-3 py-2 text-[12px] text-slate-500">
                  Signed in as <span className="font-semibold text-slate-900">{user.name || user.email || user.phone}</span>
                </div>
                <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  My Profile
                </Link>
                <Link to="/history" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  History
                </Link>
                <Link to="/support" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Support
                </Link>
                <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 hover:bg-rose-50">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Login / Sign Up
                </Link>
                <Link to="/support" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Support
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

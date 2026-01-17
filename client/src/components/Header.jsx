import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [user, setUser] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  // Check if user is logged in
  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      } else {
        setUser(null)
      }
    }

    checkUser()

    // Listen for storage changes (logout from other components)
    window.addEventListener('storage', checkUser)

    // Custom event for same-tab logout
    window.addEventListener('userLogout', checkUser)

    return () => {
      window.removeEventListener('storage', checkUser)
      window.removeEventListener('userLogout', checkUser)
    }
  }, [location]) // Re-check on route change

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/pay-challan', label: 'Pay Challan' },
    { path: '/vehicle-info', label: 'Vehicle Info' },
    { path: '/support', label: 'Support' },
  ]

  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    setUser(null)
    setIsProfileOpen(false)
    navigate('/')
  }

  return (
    <header className="bg-white border-b-2 border-blue-600 sticky top-0 z-50 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 max-w-7xl mx-auto">
          {/* Logo - Left Side */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Challan One Logo"
              className="h-12 md:h-14 w-auto"
            />
            <span className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">ChallanOne</span>
          </Link>

          {/* Right Side - Navigation + Login/Profile */}
          <div className="hidden md:flex items-center gap-8">
            {/* Navigation Links */}
            <nav className="flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-base font-medium transition-colors ${isActive(link.path)
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Login/Profile Button */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {(user.name || user.email || user.phone || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-base font-medium text-gray-700">
                    {user.name || (user.email ? user.email.split('@')[0] : user.phone)}
                  </span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-base font-semibold hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 max-w-7xl mx-auto">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm font-medium ${isActive(link.path) ? 'text-blue-600' : 'text-gray-600'
                    }`}
                >
                  {link.label}
                </Link>
              ))}

              {user ? (
                <>
                  <hr className="border-gray-200" />
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {(user.name || user.email || user.phone || 'U').charAt(0).toUpperCase()}
                    </div>
                    {user.name || (user.email ? user.email.split('@')[0] : user.phone)}
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-gray-600"
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="text-sm font-medium text-blue-600 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors w-fit"
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

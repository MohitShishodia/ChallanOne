// TopBar component - sticky header
import { Menu, Bell, Sun, Moon, LogOut, Search, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function TopBar({ onMenuClick, pageTitle }) {
  const { admin, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [notifications] = useState(3)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <header className="admin-topbar">
      {/* Left: Hamburger + Page title */}
      <button
        onClick={onMenuClick}
        className="btn btn-ghost btn-icon"
        style={{ marginRight: 4 }}
        title="Toggle menu"
      >
        <Menu size={20} />
      </button>

      <div style={{ flex: 1 }}>
        <h1 style={{
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          lineHeight: 1.2
        }}>
          {pageTitle || 'Admin Panel'}
        </h1>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost btn-icon"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          className="btn btn-ghost btn-icon"
          title="Notifications"
          style={{ position: 'relative' }}
          onClick={() => navigate('/notifications')}
        >
          <Bell size={18} />
          {notifications > 0 && (
            <span style={{
              position: 'absolute',
              top: 3, right: 3,
              width: 8, height: 8,
              background: '#ef4444',
              borderRadius: '50%',
              border: '2px solid var(--color-surface)'
            }} />
          )}
        </button>

        {/* Admin profile dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
              color: 'var(--color-text-primary)'
            }}
          >
            <div style={{
              width: 28, height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff'
            }}>
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {admin?.name || 'Admin'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {admin?.role || ''}
              </div>
            </div>
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                minWidth: 180,
                zIndex: 20,
                overflow: 'hidden',
                animation: 'slideUp 0.15s ease'
              }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{admin?.email}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{admin?.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#ef4444',
                    fontSize: 13,
                    fontWeight: 500,
                    textAlign: 'left'
                  }}
                >
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

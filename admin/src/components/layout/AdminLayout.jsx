// AdminLayout - wraps all protected admin pages
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { Toaster } from 'react-hot-toast'

// Map routes to page titles
const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/customers': 'Customer Management',
  '/challans': 'Challan Management',
  '/payments': 'Payment Management',
  '/services': 'Service Management',
  '/reports': 'Reports & Insights',
  '/cms': 'Content Management',
  '/tickets': 'Support Tickets',
  '/notifications': 'Notification Center',
  '/roles': 'Roles & Permissions',
  '/settings': 'Settings'
}

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Collapse sidebar on small screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1280px)')
    if (mq.matches) setCollapsed(true)
    const handler = (e) => { if (e.matches) setCollapsed(true) }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const pageTitle = Object.entries(PAGE_TITLES).find(([route]) =>
    location.pathname === route || location.pathname.startsWith(route + '/')
  )?.[1] || 'Admin Panel'

  return (
    <div className="admin-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(v => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={`admin-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <TopBar
          onMenuClick={() => {
            if (window.innerWidth <= 1024) {
              setMobileOpen(v => !v)
            } else {
              setCollapsed(v => !v)
            }
          }}
          pageTitle={pageTitle}
        />
        <main className="admin-main">
          {children}
        </main>
      </div>

      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-md)',
            fontSize: '13px',
            fontWeight: '500'
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
    </div>
  )
}

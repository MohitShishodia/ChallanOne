// Sidebar navigation component
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, FileText, CreditCard, Settings,
  Bell, BookOpen, LifeBuoy, BarChart3, ShieldCheck, Wrench,
  ChevronLeft, ChevronRight, Zap
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'view_dashboard' }
    ]
  },
  {
    label: 'Management',
    items: [
      { to: '/customers', icon: Users, label: 'Customers', permission: 'view_users' },
      { to: '/challans', icon: FileText, label: 'Challans', permission: 'view_challans' },
      { to: '/payments', icon: CreditCard, label: 'Payments', permission: 'view_payments' },
      { to: '/services', icon: Wrench, label: 'Services', permission: 'view_services' }
    ]
  },
  {
    label: 'Analytics',
    items: [
      { to: '/reports', icon: BarChart3, label: 'Reports', permission: 'view_reports' }
    ]
  },
  {
    label: 'Content & Support',
    items: [
      { to: '/cms', icon: BookOpen, label: 'CMS', permission: 'view_cms' },
      { to: '/tickets', icon: LifeBuoy, label: 'Support Tickets', permission: 'view_tickets' },
      { to: '/notifications', icon: Bell, label: 'Notifications', permission: 'view_notifications' }
    ]
  },
  {
    label: 'System',
    items: [
      { to: '/roles', icon: ShieldCheck, label: 'Roles & Admins', permission: 'view_roles' },
      { to: '/settings', icon: Settings, label: 'Settings', permission: 'view_settings' }
    ]
  }
]

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const { hasPermission, admin } = useAuth()
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={20} color="#fff" />
          </div>
          <span className="sidebar-logo-text">ChallanOne</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => {
            const visibleItems = section.items.filter(item => hasPermission(item.permission))
            if (visibleItems.length === 0) return null

            return (
              <div key={section.label}>
                <div className="sidebar-section-label">{section.label}</div>
                {visibleItems.map(item => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/')

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onMobileClose}
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={20} className="nav-icon" />
                      <span className="nav-label">{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Admin info + collapse toggle */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0
        }}>
          <div style={{
            width: 34, height: 34,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
          }}>
            {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="nav-label" style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {admin?.name || 'Admin'}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {admin?.role || 'Role'}
            </div>
          </div>
          <button
            onClick={onToggle}
            className="nav-label"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: 6,
              padding: 6,
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>
    </>
  )
}

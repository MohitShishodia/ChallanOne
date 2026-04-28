// Admin Dashboard - Main analytics overview
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatNumber, formatRelativeTime } from '../utils/formatters'
import Badge from '../components/ui/Badge'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Users, CreditCard, FileText, TrendingUp,
  ArrowUpRight, ArrowDownRight, Wrench, LifeBuoy,
  RefreshCw, Plus, Eye
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const STAT_CARDS = [
  {
    key: 'totalUsers',
    label: 'Total Users',
    icon: Users,
    accent: '#2563eb',
    bg: 'rgba(37,99,235,0.1)',
    format: formatNumber,
    trend: '+12%'
  },
  {
    key: 'totalPayments',
    label: 'Total Payments',
    icon: CreditCard,
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    format: formatNumber,
    trend: '+8%'
  },
  {
    key: 'pendingChallans',
    label: 'Pending Challans',
    icon: FileText,
    accent: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    format: formatNumber,
    trend: '-3%',
    trendDown: true
  },
  {
    key: 'totalRevenue',
    label: 'Total Revenue',
    icon: TrendingUp,
    accent: '#7c3aed',
    bg: 'rgba(124,58,237,0.1)',
    format: formatCurrency,
    trend: '+18%'
  }
]

const CHALLAN_COLORS = {
  PENDING: '#f59e0b',
  OVERDUE: '#ef4444',
  PAID: '#10b981'
}

const ACTIVITY_ICONS = {
  admin_login: '🔐',
  admin_logout: '🚪',
  challan_status_update: '📋',
  payment_refund: '💸',
  service_created: '⚙️',
  service_updated: '✏️',
  user_active: '✅',
  user_inactive: '🚫',
  ticket_response: '💬',
  settings_updated: '⚙️',
  email_notification_sent: '📧'
}

export default function Dashboard() {
  const { authHeaders } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [challanStats, setChallanStats] = useState([])
  const [activity, setActivity] = useState([])
  const [period, setPeriod] = useState('monthly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [period])

  async function loadAll() {
    setLoading(true)
    try {
      const [statsRes, chartRes, challanRes, activityRes] = await Promise.all([
        fetch('/api/admin/dashboard/stats', { headers: authHeaders() }),
        fetch(`/api/admin/dashboard/revenue-chart?period=${period}`, { headers: authHeaders() }),
        fetch('/api/admin/dashboard/challan-stats', { headers: authHeaders() }),
        fetch('/api/admin/dashboard/recent-activity?limit=10', { headers: authHeaders() })
      ])

      const [statsData, chartData, challanData, activityData] = await Promise.all([
        statsRes.json(), chartRes.json(), challanRes.json(), activityRes.json()
      ])

      if (statsData.success) setStats(statsData.stats)
      if (chartData.success) setChartData(chartData.data)
      if (challanData.success) {
        const s = challanData.stats
        setChallanStats([
          { name: 'Pending', value: s.PENDING || 0, color: CHALLAN_COLORS.PENDING },
          { name: 'Overdue', value: s.OVERDUE || 0, color: CHALLAN_COLORS.OVERDUE },
          { name: 'Paid', value: s.PAID || 0, color: CHALLAN_COLORS.PAID }
        ])
      }
      if (activityData.success) setActivity(activityData.activity)
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const SkeletonCard = () => (
    <div className="stat-card">
      <div className="skeleton" style={{ height: 48, width: 48, borderRadius: 10, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 28, width: '60%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 14, width: '40%' }} />
    </div>
  )

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 8, padding: '10px 14px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ fontSize: 14, fontWeight: 600, color: p.color }}>
            {p.name === 'revenue' ? formatCurrency(p.value) : formatNumber(p.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's your platform overview.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={loadAll}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/services')}>
            <Plus size={14} />
            Add Service
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 18,
        marginBottom: 28
      }} className="stagger-children">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : STAT_CARDS.map(card => {
              const Icon = card.icon
              const value = stats?.[card.key] ?? 0
              return (
                <div
                  key={card.key}
                  className="stat-card"
                  style={{ '--stat-accent': card.accent, '--stat-bg': card.bg }}
                >
                  <div className="stat-card-icon">
                    <Icon size={22} />
                  </div>
                  <div className="stat-card-value">{card.format(value)}</div>
                  <div className="stat-card-label">{card.label}</div>
                  <div className={`stat-card-trend ${card.trendDown ? 'down' : 'up'}`}>
                    {card.trendDown ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
                    {card.trend} this month
                  </div>
                </div>
              )
            })
        }
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, marginBottom: 24 }}>
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue Trends</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['daily', 'monthly', 'yearly'].map(p => (
                <button
                  key={p}
                  className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPeriod(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="skeleton" style={{ height: 240, borderRadius: 8 }} />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `₹${formatNumber(v)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fill="url(#revenueGrad)"
                    dot={{ fill: '#2563eb', strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Challan Status Pie */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Challan Status</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {loading ? (
              <div className="skeleton" style={{ width: 180, height: 180, borderRadius: '50%' }} />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={challanStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {challanStats.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [formatNumber(v), '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 8 }}>
                  {challanStats.map(s => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{s.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {formatNumber(s.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Activity Feed + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18 }}>
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 4 }}>
            <span className="card-title">Recent Activity</span>
            <button className="btn btn-ghost btn-sm">
              <Eye size={13} /> View All
            </button>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 6 }} />
                    <div className="skeleton" style={{ height: 12, width: '40%' }} />
                  </div>
                </div>
              ))
            ) : activity.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <div>No recent activity</div>
              </div>
            ) : (
              activity.map((item, i) => (
                <div key={item.id || i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  paddingBottom: 14,
                  borderBottom: i < activity.length - 1 ? '1px solid var(--color-border)' : 'none',
                  marginBottom: i < activity.length - 1 ? 14 : 0
                }}>
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: '50%',
                    background: 'var(--color-surface-3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0
                  }}>
                    {ACTIVITY_ICONS[item.action] || '⚡'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>
                      {item.admin?.name || 'System'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {item.action.replace(/_/g, ' ')}
                      {item.entityType && ` — ${item.entityType}`}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {formatRelativeTime(item.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 4 }}>
            <span className="card-title">Quick Actions</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Add New Service', icon: Wrench, to: '/services', color: '#2563eb' },
              { label: 'View Payments', icon: CreditCard, to: '/payments', color: '#10b981' },
              { label: 'Manage Challans', icon: FileText, to: '/challans', color: '#f59e0b' },
              { label: 'View Customers', icon: Users, to: '/customers', color: '#7c3aed' },
              { label: 'Support Tickets', icon: LifeBuoy, to: '/tickets', color: '#ef4444' },
              { label: 'Export Reports', icon: TrendingUp, to: '/reports', color: '#06b6d4' }
            ].map(action => {
              const Icon = action.icon
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 14px',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    color: 'var(--color-text-primary)',
                    width: '100%',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = action.color
                    e.currentTarget.style.background = `${action.color}10`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                    e.currentTarget.style.background = 'var(--color-surface-2)'
                  }}
                >
                  <div style={{
                    width: 32, height: 32,
                    borderRadius: 8,
                    background: `${action.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: action.color, flexShrink: 0
                  }}>
                    <Icon size={16} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{action.label}</span>
                  <ArrowUpRight size={13} style={{ marginLeft: 'auto', color: 'var(--color-text-muted)' }} />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Secondary stats row */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
          marginTop: 18
        }}>
          {[
            { label: "Today's Revenue", value: formatCurrency(stats.todayRevenue), icon: '💰', color: '#10b981' },
            { label: "Today's Payments", value: formatNumber(stats.todayPayments), icon: '📊', color: '#2563eb' },
            { label: 'Open Tickets', value: formatNumber(stats.openTickets), icon: '🎫', color: '#f59e0b' }
          ].map(item => (
            <div key={item.label} style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: 42, height: 42,
                borderRadius: 10,
                background: `${item.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)' }}>{item.value}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Search, RefreshCw, TrendingUp, Users, AlertTriangle, Clock } from 'lucide-react'
import { useFetch } from '../../hooks/useFetch'
import { useDebounce } from '../../hooks/useDebounce'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import { formatRelativeTime, formatNumber } from '../../utils/formatters'

export default function ApiUsageOverview() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)

  const params = new URLSearchParams({ page, limit: 25 })
  if (debouncedSearch) params.set('search', debouncedSearch)

  const { data: statsData, loading: statsLoading } = useFetch('/api/admin/api-usage/stats')
  const { data: usersData, loading: usersLoading, refetch } = useFetch(`/api/admin/users?${params}`)
  const stats = statsData?.stats
  const users = usersData?.users || []
  const pagination = usersData?.pagination

  const loading = statsLoading || usersLoading

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/api-usage/stats', {
        headers: { 'Content-Type': 'application/json' }
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message)

      const headers = ['User Email', 'User Name', 'Phone', 'Total API Calls', 'RC Details Today', 'RC Details Limit', 'RC Details Remaining']
      const rows = result.stats.topUsers.map(u => [
        u.email,
        u.name || '',
        u.phone || '',
        u.callCount,
        'N/A', // Would need per-user today count
        '10',
        'N/A'
      ])
      const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `api-usage-overview-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    }
  }

  const SkeletonCard = () => (
    <div className="stat-card">
      <div className="skeleton" style={{ height: 48, width: 48, borderRadius: 10, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 28, width: '60%', marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 14, width: '40%' }} />
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">API Usage Monitoring</h1>
          <p className="page-subtitle">Track API calls per user, rate limits, and usage patterns</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Search size={14} /> Export
          </button>
          <button className="btn btn-secondary" onClick={refetch}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats-grid stagger-children" style={{ marginBottom: 24 }}>
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : [
              {
                key: 'totalCalls',
                label: 'Total API Calls',
                value: formatNumber(stats?.totalCalls || 0),
                icon: TrendingUp,
                accent: '#2563eb',
                bg: 'rgba(37,99,235,0.1)'
              },
              {
                key: 'todayCalls',
                label: "Today's Calls",
                value: formatNumber(stats?.todayCalls || 0),
                icon: Clock,
                accent: '#10b981',
                bg: 'rgba(16,185,129,0.1)'
              },
              {
                key: 'rateLimitedCalls',
                label: 'Rate Limited',
                value: formatNumber(stats?.rateLimitedCalls || 0),
                icon: AlertTriangle,
                accent: '#ef4444',
                bg: 'rgba(239,68,68,0.1)'
              },
              {
                key: 'rcDetails',
                label: 'RC Details Calls',
                value: formatNumber(stats?.byType?.RC_DETAILS || 0),
                icon: Users,
                accent: '#7c3aed',
                bg: 'rgba(124,58,237,0.1)'
              }
            ].map(card => {
              const Icon = card.icon
              return (
                <div
                  key={card.key}
                  className="stat-card"
                  style={{ '--stat-accent': card.accent, '--stat-bg': card.bg }}
                >
                  <div className="stat-card-icon">
                    <Icon size={22} />
                  </div>
                  <div className="stat-card-value">{card.value}</div>
                  <div className="stat-card-label">{card.label}</div>
                </div>
              )
            })
        }
      </div>

      {/* API Usage by Type */}
      {stats && stats.byType && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ marginBottom: 4 }}>
            <span className="card-title">API Calls by Type</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} style={{ background: 'var(--color-surface-2)', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)' }}>{formatNumber(count)}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                    {type.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Users by API Usage */}
      {stats && stats.topUsers && stats.topUsers.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ marginBottom: 4 }}>
            <span className="card-title">Top Users by API Usage</span>
          </div>
          <div className="card-body">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>User</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Total Calls</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topUsers.slice(0, 10).map((user, i) => (
                    <tr key={user.userId} style={{ borderBottom: i < 9 ? '1px solid var(--color-border)' : 'none' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{user.name || user.email}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{user.email}</div>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 600, fontSize: 13 }}>{formatNumber(user.callCount)}</td>
                      <td style={{ padding: '12px' }}>
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => window.location.href = `/api-usage/user/${user.userId}`}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* All Users Table with Search */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span className="card-title">All Users</span>
          <div style={{ position: 'relative', minWidth: 250 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              className="form-input" style={{ paddingLeft: 36 }}
              placeholder="Search users by name, email, phone…"
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          {usersLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="skeleton" style={{ height: 200, borderRadius: 8, margin: '0 auto', maxWidth: 600 }} />
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  key: 'name',
                  label: 'User',
                  render: u => (
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{u.email}</div>
                      {u.phone && <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{u.phone}</div>}
                    </div>
                  )
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: v => <Badge status={v === 'active' ? 'active' : 'inactive'}>{v}</Badge>
                },
                {
                  key: 'createdAt',
                  label: 'Joined',
                  render: v => formatRelativeTime(v)
                },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: u => (
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => window.location.href = `/api-usage/user/${u.id}`}
                    >
                      View API Usage
                    </button>
                  )
                }
              ]}
              data={users}
              loading={usersLoading}
              pagination={pagination}
              onPageChange={setPage}
              emptyMessage="No users found"
              emptyIcon="👥"
            />
          )}
        </div>
      </div>
    </div>
  )
}
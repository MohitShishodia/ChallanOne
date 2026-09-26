import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, RefreshCw, ArrowLeft, Download, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import { useFetch } from '../../hooks/useFetch'
import { useDebounce } from '../../hooks/useDebounce'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import { formatRelativeTime, formatNumber } from '../../utils/formatters'

const TYPE_LABELS = {
  RC_DETAILS: 'RC Details',
  ALL_CHALLANS: 'All Challans',
  DELHI_OTP: 'Delhi OTP',
  DB_LOOKUP: 'DB Lookup'
}

const STATUS_COLORS = {
  success: 'active',
  failed: 'inactive',
  no_results: 'pending',
  rate_limited: 'warning'
}

const STATUS_LABELS = {
  success: 'Success',
  failed: 'Failed',
  no_results: 'No Results',
  rate_limited: 'Rate Limited'
}

export default function UserApiUsage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const debouncedTypeFilter = useDebounce(typeFilter)

  const params = new URLSearchParams({ page, limit: 30 })
  if (debouncedTypeFilter) params.set('search_type', debouncedTypeFilter)
  if (statusFilter) params.set('status', statusFilter)
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)

  const { data, loading, refetch } = useFetch(`/api/admin/api-usage/user/${userId}?${params}`)
  const user = data?.user
  const rateLimitStatus = data?.rateLimitStatus
  const logs = data?.logs || []
  const pagination = data?.pagination

  const handleExport = async () => {
    try {
      const exportParams = new URLSearchParams({ limit: 10000, ...params })
      const response = await fetch(`/api/admin/api-usage/user/${userId}?${exportParams}`, {
        headers: { 'Content-Type': 'application/json' }
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message)

      const headers = ['ID', 'Vehicle Number', 'API Type', 'Status', 'Challans Found', 'Response Time (ms)', 'Error Message', 'IP Address', 'Created At']
      const rows = result.logs.map(log => [
        log.id,
        log.vehicleNumber,
        TYPE_LABELS[log.searchType] || log.searchType,
        STATUS_LABELS[log.status] || log.status,
        log.challansFound || '',
        log.responseTimeMs || '',
        log.errorMessage || '',
        log.ipAddress || '',
        log.createdAt
      ])
      const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `user-api-usage-${user?.email || userId}-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    }
  }

  if (loading && !user) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: 60 }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 8, margin: '0 auto', maxWidth: 800 }} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
        <h2 style={{ marginBottom: 8 }}>User Not Found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/api-usage')}>
          <ArrowLeft size={14} /> Back to API Usage
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/api-usage')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ marginBottom: 4 }}>{user.name || user.email}</h1>
            <p className="page-subtitle">{user.email} • {user.phone || 'No phone'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-secondary" onClick={refetch}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Rate Limit Status Card */}
      <div className="card" style={{ marginBottom: 24, borderColor: rateLimitStatus?.rcDetailsRemaining === 0 ? '#ef4444' : rateLimitStatus?.rcDetailsRemaining <= 2 ? '#f59e0b' : '#10b981' }}>
        <div className="card-header" style={{ marginBottom: 4 }}>
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color={rateLimitStatus?.rcDetailsRemaining === 0 ? '#ef4444' : rateLimitStatus?.rcDetailsRemaining <= 2 ? '#f59e0b' : '#10b981'} />
            RC Details Rate Limit Status
          </span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            <div style={{ background: 'var(--color-surface-2)', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: rateLimitStatus?.rcDetailsRemaining === 0 ? '#ef4444' : rateLimitStatus?.rcDetailsRemaining <= 2 ? '#f59e0b' : '#10b981' }}>
                {rateLimitStatus?.rcDetailsRemaining || 0}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Calls Remaining Today</div>
            </div>
            <div style={{ background: 'var(--color-surface-2)', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {rateLimitStatus?.rcDetailsToday || 0}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Calls Used Today</div>
            </div>
            <div style={{ background: 'var(--color-surface-2)', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {rateLimitStatus?.rcDetailsLimit || 10}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Daily Limit</div>
            </div>
            <div style={{ background: 'var(--color-surface-2)', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: rateLimitStatus?.rcDetailsRemaining === 0 ? '#ef4444' : 'var(--color-text-primary)' }}>
                {rateLimitStatus?.rcDetailsRemaining === 0 ? 'LIMIT EXCEEDED' : rateLimitStatus?.rcDetailsRemaining <= 2 ? '⚠️ LOW' : 'OK'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Status</div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: 12, background: 'var(--color-surface-2)', borderRadius: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
            <strong>Rate Limit:</strong> 10 RC Details API calls per 24-hour period. Resets at midnight UTC.
            {rateLimitStatus?.rcDetailsRemaining === 0 && <span style={{ color: '#ef4444', marginLeft: 8 }}>User has exceeded daily limit.</span>}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ marginBottom: 4 }}>
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={16} /> Filters
          </span>
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <select className="form-select" style={{ width: 180 }} value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1) }}>
              <option value="">All Types</option>
              <option value="RC_DETAILS">RC Details</option>
              <option value="ALL_CHALLANS">All Challans</option>
              <option value="DELHI_OTP">Delhi OTP</option>
              <option value="DB_LOOKUP">DB Lookup</option>
            </select>
            <select className="form-select" style={{ width: 160 }} value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="no_results">No Results</option>
              <option value="rate_limited">Rate Limited</option>
            </select>
            <input
              type="date"
              className="form-input"
              style={{ width: 160 }}
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1) }}
              placeholder="Date From"
            />
            <input
              type="date"
              className="form-input"
              style={{ width: 160 }}
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1) }}
              placeholder="Date To"
            />
          </div>
        </div>
      </div>

      {/* API Usage Summary */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ marginBottom: 4 }}>
          <span className="card-title">API Usage Summary</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {Object.entries(logs.reduce((acc, log) => {
              acc[log.searchType] = (acc[log.searchType] || 0) + 1;
              return acc;
            }, {})).map(([type, count]) => (
              <div key={type} style={{ background: 'var(--color-surface-2)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)' }}>{formatNumber(count)}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                  {TYPE_LABELS[type] || type.replace(/_/g, ' ')}
                </div>
              </div>
            ))}
            <div style={{ background: 'var(--color-surface-2)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)' }}>{formatNumber(logs.filter(l => l.status === 'failed').length)}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Failed</div>
            </div>
            <div style={{ background: 'var(--color-surface-2)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>{formatNumber(logs.filter(l => l.status === 'rate_limited').length)}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Rate Limited</div>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <DataTable
        columns={[
          {
            key: 'vehicleNumber',
            label: 'Vehicle',
            render: v => <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}>{v}</span>
          },
          {
            key: 'searchType',
            label: 'API Type',
            render: v => <Badge status="active">{TYPE_LABELS[v] || v}</Badge>
          },
          {
            key: 'status',
            label: 'Status',
            render: v => <Badge status={STATUS_COLORS[v] || 'pending'}>{STATUS_LABELS[v] || v}</Badge>
          },
          {
            key: 'challansFound',
            label: 'Results',
            render: v => v > 0 ? <strong>{v}</strong> : '—'
          },
          {
            key: 'responseTimeMs',
            label: 'Response Time',
            render: v => v ? `${v}ms` : '—'
          },
          {
            key: 'errorMessage',
            label: 'Error',
            render: v => v ? (
              <span style={{ fontSize: 11, color: '#ef4444', maxWidth: 250, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>
                {v}
              </span>
            ) : '—'
          },
          {
            key: 'ipAddress',
            label: 'IP',
            render: v => <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{v || '—'}</span>
          },
          {
            key: 'createdAt',
            label: 'When',
            render: v => formatRelativeTime(v)
          }
        ]}
        data={logs}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyMessage="No API usage logs found for this user"
        emptyIcon="📋"
      />
    </div>
  )
}
import { useState, useEffect } from 'react'
import { Search, RefreshCw, Filter, Download } from 'lucide-react'
import { useFetch } from '../../hooks/useFetch'
import { useDebounce } from '../../hooks/useDebounce'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import { formatRelativeTime } from '../../utils/formatters'
import { useSocket } from '../../hooks/useSocket'

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

export default function ChallanApiLogs() {
  const [page, setPage] = useState(1)
  const [vehicle, setVehicle] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [liveLogs, setLiveLogs] = useState([])
  const debouncedVehicle = useDebounce(vehicle)

  const params = new URLSearchParams({ page, limit: 25 })
  if (debouncedVehicle) params.set('vehicle', debouncedVehicle)
  if (typeFilter) params.set('search_type', typeFilter)
  if (statusFilter) params.set('status', statusFilter)
  if (userIdFilter) params.set('userId', userIdFilter)
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)

  const { data, loading, refetch } = useFetch(`/api/admin/api-usage/challan-logs?${params}`)
  const logs = data?.logs || []
  const pagination = data?.pagination

  const socket = useSocket()
  useEffect(() => {
    if (!socket) return
    const handler = (search) => {
      if (search.searchType !== 'RC_DETAILS') {
        setLiveLogs(prev => [search, ...prev].slice(0, 10))
      }
    }
    socket.on('challan-search', handler)
    return () => socket.off('challan-search', handler)
  }, [socket])

  const columns = [
    {
      key: 'vehicleNumber',
      label: 'Vehicle',
      render: v => <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}>{v}</span>
    },
    {
      key: 'searchType',
      label: 'Type',
      render: v => <Badge status="active">{TYPE_LABELS[v] || v}</Badge>
    },
    {
      key: 'user',
      label: 'User',
      render: u => u ? (
        <div style={{ minWidth: 180 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{u.name || u.email}</div>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{u.email}</div>
        </div>
      ) : (
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Anonymous</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: v => <Badge status={STATUS_COLORS[v] || 'pending'}>{STATUS_LABELS[v] || v}</Badge>
    },
    {
      key: 'challansFound',
      label: 'Found',
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
        <span style={{ fontSize: 11, color: '#ef4444', maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v}>
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
  ]

  const handleExport = async () => {
    try {
      const exportParams = new URLSearchParams({ limit: 10000, ...params })
      const response = await fetch(`/api/admin/api-usage/challan-logs?${exportParams}`, {
        headers: { 'Content-Type': 'application/json' }
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.message)

      const headers = ['ID', 'Vehicle Number', 'API Type', 'User Email', 'User Name', 'Status', 'Challans Found', 'Response Time (ms)', 'Error Message', 'IP Address', 'Created At']
      const rows = result.logs.map(log => [
        log.id,
        log.vehicleNumber,
        TYPE_LABELS[log.searchType] || log.searchType,
        log.user?.email || 'Anonymous',
        log.user?.name || '',
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
      link.download = `challan-api-logs-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export failed. Please try again.')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Challan API Logs</h1>
          <p className="page-subtitle">Monitor all Challan API calls (All Challans, Delhi OTP, DB Lookup)</p>
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

      {liveLogs.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: '#10b981' }}>
          <div className="card-header" style={{ marginBottom: 4 }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 1s infinite' }} />
              Live Feed
            </span>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            {liveLogs.map((s, i) => (
              <div key={s.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0',
                borderBottom: i < liveLogs.length - 1 ? '1px solid var(--color-border)' : 'none',
                fontSize: 13
              }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.vehicleNumber}</span>
                <Badge status={STATUS_COLORS[s.status] || 'pending'}>{STATUS_LABELS[s.status] || s.status}</Badge>
                <span style={{ color: 'var(--color-text-muted)' }}>{TYPE_LABELS[s.searchType] || s.searchType}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {formatRelativeTime(s.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header" style={{ marginBottom: 4 }}>
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} /> Filters
          </span>
        </div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input
                className="form-input" style={{ paddingLeft: 36 }}
                placeholder="Filter by vehicle number…"
                value={vehicle} onChange={e => { setVehicle(e.target.value.toUpperCase()); setPage(1) }}
              />
            </div>
            <select className="form-select" style={{ width: 180 }} value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1) }}>
              <option value="">All Types</option>
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

      <DataTable
        columns={columns} data={logs} loading={loading}
        pagination={pagination} onPageChange={setPage}
        emptyMessage="No Challan API logs found" emptyIcon="🔍"
      />
    </div>
  )
}
import { useState, useEffect } from 'react'
import { Search, RefreshCw, Wifi } from 'lucide-react'
import { useFetch } from '../../hooks/useFetch'
import { useDebounce } from '../../hooks/useDebounce'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import { formatRelativeTime } from '../../utils/formatters'
import { useSocket } from '../../hooks/useSocket'

const TYPE_LABELS = {
  ALL_CHALLANS: 'All Challans',
  DELHI_OTP: 'Delhi OTP',
  DB_LOOKUP: 'DB Lookup'
}

const STATUS_COLORS = {
  success: 'active',
  failed: 'inactive',
  no_results: 'pending'
}

export default function ChallanSearches() {
  const [page, setPage] = useState(1)
  const [vehicle, setVehicle] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [liveSearches, setLiveSearches] = useState([])
  const debouncedVehicle = useDebounce(vehicle)

  const params = new URLSearchParams({ page, limit: 25 })
  if (debouncedVehicle) params.set('vehicle', debouncedVehicle)
  if (typeFilter) params.set('search_type', typeFilter)
  if (statusFilter) params.set('status', statusFilter)

  const { data, loading, refetch } = useFetch(`/api/admin/challan-searches?${params}`)
  const searches = data?.searches || []
  const pagination = data?.pagination

  const socket = useSocket()
  useEffect(() => {
    if (!socket) return
    const handler = (search) => {
      setLiveSearches(prev => [search, ...prev].slice(0, 10))
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
      key: 'status',
      label: 'Status',
      render: v => <Badge status={STATUS_COLORS[v] || 'pending'}>{v}</Badge>
    },
    {
      key: 'challansFound',
      label: 'Found',
      render: v => <strong>{v}</strong>
    },
    {
      key: 'responseTimeMs',
      label: 'Time',
      render: v => v ? `${v}ms` : '—'
    },
    {
      key: 'ipAddress',
      label: 'IP',
      render: v => <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{v || '—'}</span>
    },
    {
      key: 'createdAt',
      label: 'When',
      render: v => formatRelativeTime(v)
    }
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Challan Searches</h1>
          <p className="page-subtitle">Track all user challan lookups in real-time</p>
        </div>
        <button className="btn btn-secondary" onClick={refetch}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {liveSearches.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: '#10b981' }}>
          <div className="card-header" style={{ marginBottom: 4 }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wifi size={14} color="#10b981" /> Live Feed
            </span>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            {liveSearches.map((s, i) => (
              <div key={s.id || i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0',
                borderBottom: i < liveSearches.length - 1 ? '1px solid var(--color-border)' : 'none',
                fontSize: 13
              }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.vehicleNumber}</span>
                <Badge status={STATUS_COLORS[s.status] || 'pending'}>{s.status}</Badge>
                <span style={{ color: 'var(--color-text-muted)' }}>{s.searchType?.replace(/_/g, ' ')}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {s.challansFound} found — {formatRelativeTime(s.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className="form-input" style={{ paddingLeft: 36 }}
            placeholder="Filter by vehicle number…"
            value={vehicle} onChange={e => { setVehicle(e.target.value.toUpperCase()); setPage(1) }}
          />
        </div>
        <select className="form-select" style={{ width: 160 }} value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1) }}>
          <option value="">All Types</option>
          <option value="ALL_CHALLANS">All Challans</option>
          <option value="DELHI_OTP">Delhi OTP</option>
          <option value="DB_LOOKUP">DB Lookup</option>
        </select>
        <select className="form-select" style={{ width: 140 }} value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="no_results">No Results</option>
        </select>
      </div>

      <DataTable
        columns={columns} data={searches} loading={loading}
        pagination={pagination} onPageChange={setPage}
        emptyMessage="No challan searches recorded yet" emptyIcon="🔍"
      />
    </div>
  )
}

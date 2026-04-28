// Challan Management Page
import { useState } from 'react'
import { Search, Eye, RefreshCw } from 'lucide-react'
import { useFetch, useApi } from '../../hooks/useFetch'
import { useDebounce } from '../../hooks/useDebounce'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { formatDate, formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const STATUSES = ['PENDING', 'OVERDUE', 'PAID', 'RESOLVED', 'CANCELLED']

export default function ChallanList() {
  const { request } = useApi()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedChallan, setSelectedChallan] = useState(null)
  const [updating, setUpdating] = useState(false)
  const debouncedSearch = useDebounce(search)

  const params = new URLSearchParams({ page, limit: 20 })
  if (debouncedSearch) params.set('search', debouncedSearch)
  if (statusFilter) params.set('status', statusFilter)
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)

  const { data, loading, refetch } = useFetch(`/api/admin/challans?${params}`)
  const challans = data?.challans || []
  const pagination = data?.pagination

  const handleStatusUpdate = async (id, newStatus) => {
    setUpdating(true)
    try {
      const res = await request(`/api/admin/challans/${id}/status`, {
        method: 'PATCH',
        body: { status: newStatus }
      })
      if (res.success) {
        toast.success(`Challan status updated to ${newStatus}`)
        refetch()
        setSelectedChallan(null)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const columns = [
    {
      key: 'challanNumber',
      label: 'Challan No.',
      render: v => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 12 }}>{v}</span>
      )
    },
    { key: 'vehicleNumber', label: 'Vehicle' },
    { key: 'violationType', label: 'Violation' },
    {
      key: 'amount',
      label: 'Amount',
      render: v => <strong>{formatCurrency(v)}</strong>
    },
    {
      key: 'status',
      label: 'Status',
      render: v => <Badge status={v}>{v}</Badge>
    },
    {
      key: 'fineDate',
      label: 'Date',
      sortable: true,
      render: v => formatDate(v)
    },
    { key: 'location', label: 'Location', render: v => (
      <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
        {v || '—'}
      </span>
    )},
    {
      key: 'id',
      label: 'Actions',
      render: (id, row) => (
        <button
          className="btn btn-ghost btn-sm btn-icon"
          onClick={() => setSelectedChallan(row)}
          title="View & update"
        >
          <Eye size={14} />
        </button>
      )
    }
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Challan Management</h1>
          <p className="page-subtitle">View and manage all traffic challans</p>
        </div>
        <button className="btn btn-secondary" onClick={refetch}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search challan no., vehicle, location…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="form-select" style={{ width: 160 }} value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" className="form-input" style={{ width: 160 }} value={dateFrom}
          onChange={e => setDateFrom(e.target.value)} />
        <input type="date" className="form-input" style={{ width: 160 }} value={dateTo}
          onChange={e => setDateTo(e.target.value)} />
      </div>

      <DataTable columns={columns} data={challans} loading={loading}
        pagination={pagination} onPageChange={setPage}
        emptyMessage="No challans found" emptyIcon="📋" />

      {/* Challan Detail Modal */}
      <Modal
        open={!!selectedChallan}
        onClose={() => setSelectedChallan(null)}
        title={`Challan: ${selectedChallan?.challanNumber || ''}`}
        size="md"
      >
        {selectedChallan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                ['Vehicle', selectedChallan.vehicleNumber],
                ['Owner', selectedChallan.ownerName],
                ['Violation', selectedChallan.violationType],
                ['Amount', formatCurrency(selectedChallan.amount)],
                ['Location', selectedChallan.location],
                ['Date', formatDate(selectedChallan.fineDate)],
                ['Issued By', selectedChallan.issuedBy],
                ['Current Status', '']
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                  {label === 'Current Status'
                    ? <Badge status={selectedChallan.status}>{selectedChallan.status}</Badge>
                    : <div style={{ fontSize: 14, fontWeight: 500 }}>{value || '—'}</div>
                  }
                </div>
              ))}
            </div>

            <hr className="divider" />

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Update Status</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {STATUSES.map(s => (
                  <button
                    key={s}
                    className={`btn btn-sm ${selectedChallan.status === s ? 'btn-primary' : 'btn-secondary'}`}
                    disabled={updating}
                    onClick={() => handleStatusUpdate(selectedChallan.id, s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

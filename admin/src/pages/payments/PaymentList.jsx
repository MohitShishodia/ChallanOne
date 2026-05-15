// Payment Management Page
import { useState } from 'react'
import { Search, Download, Eye, RefreshCw } from 'lucide-react'
import { useFetch, useApi } from '../../hooks/useFetch'
import { useDebounce } from '../../hooks/useDebounce'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { apiUrl } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

export default function PaymentList() {
  const { authHeaders } = useAuth()
  const { request } = useApi()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [detail, setDetail] = useState(null)
  const [exporting, setExporting] = useState(false)
  const debouncedSearch = useDebounce(search)

  const params = new URLSearchParams({ page, limit: 20 })
  if (debouncedSearch) params.set('search', debouncedSearch)
  if (statusFilter) params.set('status', statusFilter)
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)

  const { data, loading, refetch } = useFetch(`/api/admin/payments?${params}`)
  const payments = data?.payments || []
  const pagination = data?.pagination

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const exportParams = new URLSearchParams()
      if (statusFilter) exportParams.set('status', statusFilter)
      if (dateFrom) exportParams.set('dateFrom', dateFrom)
      if (dateTo) exportParams.set('dateTo', dateTo)

      const res = await fetch(apiUrl(`/api/admin/payments/export/csv?${exportParams}`), {
        headers: authHeaders()
      })

      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payments_${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported successfully')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const exportParams = new URLSearchParams()
      if (statusFilter) exportParams.set('status', statusFilter)
      if (dateFrom) exportParams.set('dateFrom', dateFrom)
      if (dateTo) exportParams.set('dateTo', dateTo)

      const res = await fetch(apiUrl(`/api/admin/payments/export/pdf?${exportParams}`), {
        headers: authHeaders()
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payments_${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF exported successfully')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleRefund = async (id) => {
    try {
      const res = await request(`/api/admin/payments/${id}/refund`, {
        method: 'POST',
        body: { reason: 'Admin initiated refund' }
      })
      if (res.success) {
        toast.success('Refund processed')
        refetch()
        setDetail(null)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Refund failed')
    }
  }

  const columns = [
    { key: 'vehicleNumber', label: 'Vehicle' },
    {
      key: 'totalAmount',
      label: 'Amount',
      render: v => <strong style={{ color: '#10b981' }}>{formatCurrency(v)}</strong>
    },
    {
      key: 'convenienceFee',
      label: 'Fee',
      render: v => <span style={{ color: 'var(--color-text-muted)' }}>{formatCurrency(v)}</span>
    },
    { key: 'paymentMethod', label: 'Method' },
    {
      key: 'razorpayPaymentId',
      label: 'Razorpay ID',
      render: v => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v || '—'}</span>
    },
    {
      key: 'status',
      label: 'Status',
      render: v => <Badge status={v}>{v}</Badge>
    },
    { key: 'paidAt', label: 'Paid At', sortable: true, render: v => formatDateTime(v) },
    {
      key: 'id',
      label: 'Actions',
      render: (id, row) => (
        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDetail(row)}>
          <Eye size={14} />
        </button>
      )
    }
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Complete payment history and reconciliation</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={handleExportCSV} disabled={exporting}>
            <Download size={14} /> CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF} disabled={exporting}>
            <Download size={14} /> PDF
          </button>
          <button className="btn btn-secondary" onClick={refetch}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search vehicle, payment ID…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="form-select" style={{ width: 160 }} value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
        <input type="date" className="form-input" style={{ width: 160 }} value={dateFrom}
          onChange={e => setDateFrom(e.target.value)} />
        <input type="date" className="form-input" style={{ width: 160 }} value={dateTo}
          onChange={e => setDateTo(e.target.value)} />
      </div>

      <DataTable columns={columns} data={payments} loading={loading}
        pagination={pagination} onPageChange={setPage}
        emptyMessage="No payments found" emptyIcon="💳" />

      {/* Payment Detail Modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Payment Details"
        footer={
          detail?.status === 'SUCCESS' && (
            <button className="btn btn-danger" onClick={() => handleRefund(detail.id)}>
              Process Refund
            </button>
          )
        }
      >
        {detail && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              ['Vehicle', detail.vehicleNumber],
              ['Status', ''],
              ['Total Amount', formatCurrency(detail.totalAmount)],
              ['Subtotal', formatCurrency(detail.subtotal)],
              ['Convenience Fee', formatCurrency(detail.convenienceFee)],
              ['Method', detail.paymentMethod],
              ['Order ID', detail.razorpayOrderId],
              ['Payment ID', detail.razorpayPaymentId],
              ['Paid At', formatDateTime(detail.paidAt)]
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
                {label === 'Status'
                  ? <Badge status={detail.status}>{detail.status}</Badge>
                  : <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all' }}>{value || '—'}</div>
                }
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

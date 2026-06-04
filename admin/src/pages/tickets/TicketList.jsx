// Customer messages from website support / contact forms
import { useState, useEffect } from 'react'
import { Search, MessageSquare, UserCheck, Mail } from 'lucide-react'
import { useFetch, useApi } from '../../hooks/useFetch'
import { useDebounce } from '../../hooks/useDebounce'
import { useSocket } from '../../hooks/useSocket'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed']
const PRIORITY_OPTIONS = ['low', 'medium', 'high']

export default function TicketList() {
  const { request } = useApi()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketDetail, setTicketDetail] = useState(null)
  const [replyMsg, setReplyMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const debouncedSearch = useDebounce(search)

  const params = new URLSearchParams({ page, limit: 20 })
  if (debouncedSearch) params.set('search', debouncedSearch)
  if (statusFilter) params.set('status', statusFilter)
  if (priorityFilter) params.set('priority', priorityFilter)

  const socket = useSocket()
  const { data, loading, refetch } = useFetch(`/api/admin/tickets?${params}`)
  const tickets = data?.tickets || []
  const pagination = data
    ? { page: data.page, limit: 20, total: data.total, totalPages: data.totalPages }
    : null

  useEffect(() => {
    if (!socket) return
    const handler = () => refetch()
    socket.on('new-support-message', handler)
    return () => socket.off('new-support-message', handler)
  }, [socket, refetch])

  const openTicket = async (row) => {
    setSelectedTicket(row)
    try {
      const res = await request(`/api/admin/tickets/${row.id}`)
      if (res.success) setTicketDetail(res.ticket)
    } catch {
      toast.error('Failed to load ticket')
    }
  }

  const handleReply = async () => {
    if (!replyMsg.trim()) return
    setSaving(true)
    try {
      const res = await request(`/api/admin/tickets/${selectedTicket.id}/respond`, {
        method: 'POST',
        body: { message: replyMsg }
      })
      if (res.success) {
        toast.success('Response sent')
        setReplyMsg('')
        openTicket(selectedTicket)
        refetch()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Failed to send')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id, status) => {
    try {
      const res = await request(`/api/admin/tickets/${id}/status`, { method: 'PATCH', body: { status } })
      if (res.success) {
        toast.success('Status updated')
        refetch()
        if (selectedTicket?.id === id) {
          setSelectedTicket(v => ({ ...v, status }))
          setTicketDetail(v => v ? { ...v, status } : null)
        }
      }
    } catch {
      toast.error('Failed to update status')
    }
  }

  const columns = [
    {
      key: 'subject',
      label: 'Subject',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {row.guestEmail || row.user?.email || 'No email'}
            {row.source && ` · ${row.source}`}
          </div>
        </div>
      )
    },
    { key: 'priority', label: 'Priority', render: v => <Badge status={v}>{v}</Badge> },
    { key: 'status', label: 'Status', render: v => <Badge status={v}>{v?.replace('_', ' ')}</Badge> },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: v => v ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserCheck size={13} color="#10b981" />
          <span style={{ fontSize: 12 }}>{v.name}</span>
        </div>
      ) : <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Unassigned</span>
    },
    { key: 'createdAt', label: 'Created', render: v => formatDateTime(v) },
    {
      key: 'id',
      label: 'Actions',
      render: (id, row) => (
        <button className="btn btn-ghost btn-sm" onClick={() => openTicket(row)}>
          <MessageSquare size={14} /> View
        </button>
      )
    }
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Messages</h1>
          <p className="page-subtitle">Messages sent from Support page and website contact forms</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search messages…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="form-select" style={{ width: 150 }} value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select className="form-select" style={{ width: 150 }} value={priorityFilter}
          onChange={e => { setPriorityFilter(e.target.value); setPage(1) }}>
          <option value="">All Priority</option>
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={tickets} loading={loading}
        pagination={pagination} onPageChange={setPage}
        emptyMessage="No messages yet" emptyIcon="💬" />

      {/* Ticket Detail Modal */}
      <Modal
        open={!!selectedTicket}
        onClose={() => { setSelectedTicket(null); setTicketDetail(null); setReplyMsg('') }}
        title={selectedTicket?.subject || 'Support Ticket'}
        size="lg"
      >
        {ticketDetail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Metadata */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div><span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Status</span><br />
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} className={`btn btn-sm ${ticketDetail.status === s ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleStatusChange(ticketDetail.id, s)}>
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            {(ticketDetail.guestName || ticketDetail.guestEmail) && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
                {ticketDetail.guestName && (
                  <span><strong>Name:</strong> {ticketDetail.guestName}</span>
                )}
                {ticketDetail.guestEmail && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Mail size={13} />
                    <a href={`mailto:${ticketDetail.guestEmail}`}>{ticketDetail.guestEmail}</a>
                  </span>
                )}
                {ticketDetail.source && <span><strong>Source:</strong> {ticketDetail.source}</span>}
              </div>
            )}

            <div style={{ background: 'var(--color-surface-2)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                {ticketDetail.guestEmail || ticketDetail.user?.email || 'Customer'} · {formatDateTime(ticketDetail.createdAt)}
              </div>
              <p style={{ fontSize: 14, color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap' }}>{ticketDetail.description}</p>
            </div>

            {/* Responses */}
            {ticketDetail.responses?.map(r => (
              <div key={r.id} style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.12)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', marginBottom: 6 }}>
                  Admin: {r.admin?.name} · {formatDateTime(r.createdAt)}
                </div>
                <p style={{ fontSize: 14 }}>{r.message}</p>
              </div>
            ))}

            {/* Reply box */}
            <div>
              <textarea className="form-textarea" placeholder="Type your reply…" style={{ minHeight: 80 }}
                value={replyMsg} onChange={e => setReplyMsg(e.target.value)} />
              <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={handleReply} disabled={saving || !replyMsg.trim()}>
                {saving ? 'Sending…' : 'Send Reply'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

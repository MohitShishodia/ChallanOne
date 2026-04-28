// Notifications Page
import { useState } from 'react'
import { Send, Bell, Mail, MessageSquare, Clock } from 'lucide-react'
import { useFetch, useApi } from '../../hooks/useFetch'
import Badge from '../../components/ui/Badge'
import { formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function Notifications() {
  const { request, loading: sending } = useApi()
  const [tab, setTab] = useState('send')
  const [notifType, setNotifType] = useState('email')
  const [form, setForm] = useState({ subject: '', body: '', message: '', title: '', recipients: 'all_users' })
  const [page, setPage] = useState(1)

  const { data, loading, refetch } = useFetch(`/api/admin/notifications/history?page=${page}&limit=20`)
  const notifications = data?.notifications || []
  const pagination = data?.pagination

  const handleSend = async () => {
    try {
      let url, body
      if (notifType === 'email') {
        if (!form.subject || !form.body) { toast.error('Subject and body required'); return }
        url = '/api/admin/notifications/email'
        body = { subject: form.subject, body: form.body, recipients: form.recipients }
      } else if (notifType === 'sms') {
        if (!form.message) { toast.error('Message required'); return }
        url = '/api/admin/notifications/sms'
        body = { message: form.message, recipients: form.recipients }
      } else {
        if (!form.title || !form.message) { toast.error('Title and message required'); return }
        url = '/api/admin/notifications/push'
        body = { title: form.title, message: form.message, recipients: form.recipients }
      }
      const res = await request(url, { method: 'POST', body })
      if (res.success) {
        toast.success('Notification sent!')
        setForm({ subject: '', body: '', message: '', title: '', recipients: 'all_users' })
        refetch()
      } else toast.error(res.message)
    } catch { toast.error('Failed to send notification') }
  }

  const TYPE_ICONS = { email: Mail, sms: MessageSquare, push: Bell }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notification Center</h1>
          <p className="page-subtitle">Send and manage platform notifications</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[['send', Send, 'Send Notification'], ['history', Clock, 'History']].map(([key, Icon, label]) => (
          <button key={key} className={`btn ${tab === key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(key)}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
          {/* Type selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['email', 'Email', 'Send bulk emails to users'], ['sms', 'SMS', 'Send SMS messages'], ['push', 'Push', 'Web push notifications']].map(([key, label, desc]) => {
              const Icon = TYPE_ICONS[key]
              return (
                <button key={key}
                  onClick={() => setNotifType(key)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 16px',
                    background: notifType === key ? 'rgba(37,99,235,0.08)' : 'var(--color-surface)',
                    border: `1.5px solid ${notifType === key ? '#2563eb' : 'var(--color-border)'}`,
                    borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: notifType === key ? 'rgba(37,99,235,0.15)' : 'var(--color-surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: notifType === key ? '#2563eb' : 'var(--color-text-muted)', flexShrink: 0 }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-primary)' }}>{label}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{desc}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Compose form */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Compose {notifType.charAt(0).toUpperCase() + notifType.slice(1)} Notification</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Recipients</label>
                <select className="form-select" value={form.recipients} onChange={e => setForm(f => ({ ...f, recipients: e.target.value }))}>
                  <option value="all_users">All Users</option>
                  <option value="active_users">Active Users Only</option>
                </select>
              </div>

              {notifType === 'push' && (
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Notification title" />
                </div>
              )}

              {notifType === 'email' && (
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input className="form-input" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Email subject" />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  {notifType === 'email' ? 'Email Body' : 'Message'}
                </label>
                <textarea className="form-textarea" style={{ minHeight: 140 }}
                  value={notifType === 'email' ? form.body : form.message}
                  onChange={e => setForm(f => ({ ...f, [notifType === 'email' ? 'body' : 'message']: e.target.value }))}
                  placeholder="Write your notification content here…" />
              </div>

              <button className="btn btn-primary" onClick={handleSend} disabled={sending} style={{ alignSelf: 'flex-start' }}>
                <Send size={14} />
                {sending ? 'Sending…' : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>Type</th><th>Subject</th><th>Recipients</th><th>Status</th><th>Sent At</th></tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>
                    ))}</tr>
                  ))
                : notifications.length === 0
                ? <tr><td colSpan={5}><div className="empty-state">No notifications sent yet</div></td></tr>
                : notifications.map(n => {
                    const Icon = TYPE_ICONS[n.type] || Bell
                    return (
                      <tr key={n.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Icon size={14} color="var(--color-text-muted)" />
                            <span style={{ textTransform: 'capitalize', fontSize: 13 }}>{n.type}</span>
                          </div>
                        </td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.subject || '—'}</td>
                        <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{n.recipients}</td>
                        <td><Badge status={n.status}>{n.status}</Badge></td>
                        <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDateTime(n.sent_at)}</td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

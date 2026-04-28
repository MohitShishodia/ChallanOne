// Service Management Page
import { useState } from 'react'
import { Plus, Edit, Trash2, Star, ToggleLeft, ToggleRight, Search } from 'lucide-react'
import { useFetch, useApi } from '../../hooks/useFetch'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import Modal, { ConfirmDialog } from '../../components/ui/Modal'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', description: '', price: '', status: 'active', is_featured: false, icon: '' }

export default function ServiceList() {
  const { request } = useApi()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const params = new URLSearchParams({ page, limit: 20 })
  if (search) params.set('search', search)

  const { data, loading, refetch } = useFetch(`/api/admin/services?${params}`)
  const services = data?.services || []
  const pagination = data?.pagination

  const openCreate = () => {
    setEditData(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditData(row)
    setForm({
      name: row.name,
      description: row.description || '',
      price: row.price,
      status: row.status,
      is_featured: row.isFeatured,
      icon: row.icon || ''
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || form.price === '') {
      toast.error('Name and price are required')
      return
    }
    setSaving(true)
    try {
      const url = editData ? `/api/admin/services/${editData.id}` : '/api/admin/services'
      const method = editData ? 'PUT' : 'POST'
      const res = await request(url, { method, body: { ...form, price: parseFloat(form.price) } })

      if (res.success) {
        toast.success(editData ? 'Service updated' : 'Service created')
        setFormOpen(false)
        refetch()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Failed to save service')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await request(`/api/admin/services/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.success) {
        toast.success('Service deleted')
        refetch()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleToggle = async (id, type) => {
    try {
      const res = await request(`/api/admin/services/${id}/${type}`, { method: 'PATCH' })
      if (res.success) {
        toast.success(type === 'featured' ? 'Featured status toggled' : 'Status toggled')
        refetch()
      }
    } catch {
      toast.error('Failed to toggle')
    }
  }

  const columns = [
    {
      key: 'icon',
      label: '',
      render: (icon, row) => (
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'var(--color-surface-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18
        }}>
          {icon || '🔧'}
        </div>
      )
    },
    {
      key: 'name',
      label: 'Service',
      render: (name, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.description || '—'}
          </div>
        </div>
      )
    },
    { key: 'category', label: 'Category', render: v => v?.name || '—' },
    { key: 'price', label: 'Price', render: v => <strong>{formatCurrency(v)}</strong> },
    { key: 'status', label: 'Status', render: v => <Badge status={v}>{v}</Badge> },
    {
      key: 'isFeatured',
      label: 'Featured',
      render: (v, row) => (
        <button
          className={`btn btn-sm btn-icon ${v ? 'btn-ghost' : 'btn-ghost'}`}
          onClick={() => handleToggle(row.id, 'featured')}
          style={{ color: v ? '#f59e0b' : 'var(--color-text-muted)' }}
          title="Toggle featured"
        >
          <Star size={15} fill={v ? '#f59e0b' : 'none'} />
        </button>
      )
    },
    {
      key: 'id',
      label: 'Actions',
      render: (id, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleToggle(id, 'status')} title={row.status === 'active' ? 'Deactivate' : 'Activate'}>
            {row.status === 'active' ? <ToggleRight size={16} color="#10b981" /> : <ToggleLeft size={16} color="#94a3b8" />}
          </button>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(row)} title="Edit">
            <Edit size={14} />
          </button>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setDeleteTarget(row)} title="Delete" style={{ color: '#ef4444' }}>
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-subtitle">Manage your platform services and pricing</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Service
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search services…"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      <DataTable columns={columns} data={services} loading={loading}
        pagination={pagination} onPageChange={setPage}
        emptyMessage="No services found. Add your first service!" emptyIcon="⚙️" />

      {/* Add/Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editData ? 'Edit Service' : 'Add New Service'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editData ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Service Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Pay Traffic Challan" />
            </div>
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input type="number" className="form-input" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Icon (emoji)</label>
              <input className="form-input" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="💳" />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <label className="switch">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                <span className="switch-track" />
                <span className="switch-thumb" style={{ position: 'absolute' }} />
              </label>
              <span className="form-label" style={{ margin: 0 }}>Featured Service</span>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Service description…" />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Service"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}

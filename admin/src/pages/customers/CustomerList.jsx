// Customer Management Page
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, UserCheck, UserX } from 'lucide-react'
import { useFetch, useApi } from '../../hooks/useFetch'
import { useDebounce } from '../../hooks/useDebounce'
import DataTable from '../../components/ui/DataTable'
import Badge from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/Modal'
import { formatDate, formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function CustomerList() {
  const navigate = useNavigate()
  const { request } = useApi()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [confirmUser, setConfirmUser] = useState(null)
  const debouncedSearch = useDebounce(search)

  const params = new URLSearchParams({ page, limit: 20 })
  if (debouncedSearch) params.set('search', debouncedSearch)
  if (statusFilter) params.set('status', statusFilter)

  const { data, loading, refetch } = useFetch(`/api/admin/users?${params}`)

  const users = data?.users || []
  const pagination = data?.pagination

  const handleStatusToggle = async () => {
    if (!confirmUser) return
    const newStatus = confirmUser.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await request(`/api/admin/users/${confirmUser.id}/status`, {
        method: 'PATCH',
        body: { status: newStatus }
      })
      if (res.success) {
        toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
        refetch()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Failed to update user status')
    } finally {
      setConfirmUser(null)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      render: (name, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
          }}>
            {(name || row.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{name || '—'}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{row.email}</div>
          </div>
        </div>
      )
    },
    { key: 'phone', label: 'Phone', render: v => v || '—' },
    {
      key: 'status',
      label: 'Status',
      render: v => <Badge status={v || 'active'}>{v || 'active'}</Badge>
    },
    {
      key: 'createdAt',
      label: 'Joined',
      sortable: true,
      render: v => formatDate(v)
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      render: v => formatDateTime(v)
    },
    {
      key: 'id',
      label: 'Actions',
      render: (id, row) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => navigate(`/customers/${id}`)}
            title="View details"
          >
            <Eye size={14} />
          </button>
          <button
            className={`btn btn-sm btn-icon ${row.status === 'active' ? 'btn-ghost' : 'btn-success'}`}
            onClick={() => setConfirmUser(row)}
            title={row.status === 'active' ? 'Deactivate' : 'Activate'}
          >
            {row.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
          </button>
        </div>
      )
    }
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage and monitor all registered users</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--color-text-muted)'
          }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search by name, email, phone…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          className="form-select"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        emptyMessage="No customers found"
        emptyIcon="👥"
      />

      <ConfirmDialog
        open={!!confirmUser}
        onClose={() => setConfirmUser(null)}
        onConfirm={handleStatusToggle}
        title={confirmUser?.status === 'active' ? 'Deactivate User' : 'Activate User'}
        message={`Are you sure you want to ${confirmUser?.status === 'active' ? 'deactivate' : 'activate'} ${confirmUser?.name || confirmUser?.email}?`}
        confirmLabel={confirmUser?.status === 'active' ? 'Deactivate' : 'Activate'}
        danger={confirmUser?.status === 'active'}
      />
    </div>
  )
}

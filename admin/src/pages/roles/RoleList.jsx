// Roles & Admins Management Page
import { useState } from 'react'
import { Plus, Edit, Trash2, Shield, Users } from 'lucide-react'
import { useFetch, useApi } from '../../hooks/useFetch'
import Modal, { ConfirmDialog } from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { formatDateTime } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const ALL_PERMISSIONS = [
  { key: 'view_dashboard', label: 'View Dashboard', group: 'Dashboard' },
  { key: 'view_users', label: 'View Users', group: 'Users' },
  { key: 'manage_users', label: 'Manage Users', group: 'Users' },
  { key: 'view_challans', label: 'View Challans', group: 'Challans' },
  { key: 'manage_challans', label: 'Manage Challans', group: 'Challans' },
  { key: 'view_payments', label: 'View Payments', group: 'Payments' },
  { key: 'manage_payments', label: 'Manage Payments', group: 'Payments' },
  { key: 'process_refunds', label: 'Process Refunds', group: 'Payments' },
  { key: 'view_services', label: 'View Services', group: 'Services' },
  { key: 'manage_services', label: 'Manage Services', group: 'Services' },
  { key: 'view_reports', label: 'View Reports', group: 'Reports' },
  { key: 'export_reports', label: 'Export Reports', group: 'Reports' },
  { key: 'view_settings', label: 'View Settings', group: 'Settings' },
  { key: 'manage_settings', label: 'Manage Settings', group: 'Settings' },
  { key: 'view_notifications', label: 'View Notifications', group: 'Notifications' },
  { key: 'send_notifications', label: 'Send Notifications', group: 'Notifications' },
  { key: 'view_cms', label: 'View CMS', group: 'CMS' },
  { key: 'manage_cms', label: 'Manage CMS', group: 'CMS' },
  { key: 'view_tickets', label: 'View Tickets', group: 'Support' },
  { key: 'manage_tickets', label: 'Manage Tickets', group: 'Support' },
  { key: 'view_roles', label: 'View Roles', group: 'Roles' },
  { key: 'manage_roles', label: 'Manage Roles', group: 'Roles' },
  { key: 'manage_admins', label: 'Manage Admins', group: 'Roles' }
]

export default function RoleList() {
  const { admin: currentAdmin } = useAuth()
  const { request } = useApi()
  const { data: rolesData, loading: rolesLoading, refetch: refetchRoles } = useFetch('/api/admin/roles/roles')
  const { data: adminsData, loading: adminsLoading, refetch: refetchAdmins } = useFetch('/api/admin/roles/admins')
  const [tab, setTab] = useState('roles')
  const [modalOpen, setModalOpen] = useState(false)
  const [adminModalOpen, setAdminModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteAdminTarget, setDeleteAdminTarget] = useState(null)
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] })
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', role_id: '' })
  const [saving, setSaving] = useState(false)

  const roles = rolesData?.roles || []
  const admins = adminsData?.admins || []

  const openRoleEdit = (role = null) => {
    setEditTarget(role)
    setRoleForm(role ? { name: role.name, permissions: role.permissions || [] } : { name: '', permissions: [] })
    setModalOpen(true)
  }

  const togglePermission = (perm) => {
    setRoleForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm]
    }))
  }

  const handleSaveRole = async () => {
    if (!roleForm.name) { toast.error('Role name is required'); return }
    setSaving(true)
    try {
      const url = editTarget ? `/api/admin/roles/roles/${editTarget.id}` : '/api/admin/roles/roles'
      const method = editTarget ? 'PUT' : 'POST'
      const res = await request(url, { method, body: roleForm })
      if (res.success) {
        toast.success(editTarget ? 'Role updated' : 'Role created')
        setModalOpen(false)
        refetchRoles()
      } else toast.error(res.message)
    } catch { toast.error('Failed to save role') }
    finally { setSaving(false) }
  }

  const handleDeleteRole = async () => {
    if (!deleteTarget) return
    try {
      const res = await request(`/api/admin/roles/roles/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.success) { toast.success('Role deleted'); refetchRoles() }
      else toast.error(res.message)
    } catch { toast.error('Delete failed') }
    finally { setDeleteTarget(null) }
  }

  const handleDeleteAdmin = async () => {
    if (!deleteAdminTarget) return
    try {
      const res = await request(`/api/admin/roles/admins/${deleteAdminTarget.id}`, { method: 'DELETE' })
      if (res.success) { toast.success(`${deleteAdminTarget.name} deleted`); refetchAdmins() }
      else toast.error(res.message || 'Delete failed')
    } catch { toast.error('Delete failed') }
    finally { setDeleteAdminTarget(null) }
  }

  const handleCreateAdmin = async () => {
    const { name, email, password, role_id } = adminForm
    if (!name || !email || !password || !role_id) { toast.error('All fields required'); return }
    setSaving(true)
    try {
      const res = await request('/api/admin/roles/admins', { method: 'POST', body: adminForm })
      if (res.success) {
        toast.success('Admin created')
        setAdminModalOpen(false)
        setAdminForm({ name: '', email: '', password: '', role_id: '' })
        refetchAdmins()
      } else toast.error(res.message)
    } catch { toast.error('Failed to create admin') }
    finally { setSaving(false) }
  }

  const groupedPerms = ALL_PERMISSIONS.reduce((acc, p) => {
    if (!acc[p.group]) acc[p.group] = []
    acc[p.group].push(p)
    return acc
  }, {})

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Roles & Admins</h1>
          <p className="page-subtitle">Manage roles, permissions, and admin users</p>
        </div>
        <button className="btn btn-primary" onClick={() => tab === 'roles' ? openRoleEdit() : setAdminModalOpen(true)}>
          <Plus size={14} /> {tab === 'roles' ? 'Add Role' : 'Add Admin'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[['roles', Shield, 'Roles'], ['admins', Users, 'Admin Users']].map(([key, Icon, label]) => (
          <button key={key} className={`btn ${tab === key ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab(key)} style={{ gap: 6 }}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {tab === 'roles' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {rolesLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card"><div className="card-body">
                  <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
                </div></div>
              ))
            : roles.map(role => (
                <div key={role.id} className="card">
                  <div className="card-header" style={{ alignItems: 'flex-start', paddingBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Shield size={16} color="#2563eb" />
                        {role.name}
                        {role.is_system && <Badge color="info" status="">System</Badge>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                        {role.permissions?.length || 0} permissions
                      </div>
                    </div>
                    {!role.is_system && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openRoleEdit(role)}><Edit size={13} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteTarget(role)} style={{ color: '#ef4444' }}><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                  <div className="card-body" style={{ paddingTop: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(role.permissions || []).slice(0, 6).map(p => (
                        <span key={p} className="tag">{p.replace(/_/g, ' ')}</span>
                      ))}
                      {(role.permissions?.length || 0) > 6 && (
                        <span className="tag">+{role.permissions.length - 6} more</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
          }
        </div>
      )}

      {tab === 'admins' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Admin</th><th>Role</th><th>Status</th><th>Created</th><th>Last Login</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14, borderRadius: 4 }} /></td>
                  ))}</tr>
                ))
              ) : admins.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state">No admins found</div></td></tr>
              ) : admins.map(admin => (
                <tr key={admin.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                        {admin.name?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{admin.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><Badge color="info" status="">{admin.role_name}</Badge></td>
                  <td><Badge status={admin.status}>{admin.status}</Badge></td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDateTime(admin.createdAt)}</td>
                  <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDateTime(admin.lastLogin) || '—'}</td>
                  <td>
                    {admin.id !== currentAdmin?.id ? (
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => setDeleteAdminTarget(admin)}
                        title={`Delete ${admin.name}`}
                        style={{ color: '#ef4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>You</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'Edit Role' : 'Create Role'} size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveRole} disabled={saving}>
              {saving ? 'Saving…' : editTarget ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Role Name *</label>
            <input className="form-input" value={roleForm.name} onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Editor" />
          </div>
          <div>
            <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Permissions</label>
            {Object.entries(groupedPerms).map(([group, perms]) => (
              <div key={group} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>{group}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {perms.map(p => {
                    const checked = roleForm.permissions.includes(p.key)
                    return (
                      <button key={p.key}
                        className={`btn btn-sm ${checked ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => togglePermission(p.key)}>
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Create Admin Modal */}
      <Modal open={adminModalOpen} onClose={() => setAdminModalOpen(false)} title="Create Admin User"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAdminModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateAdmin} disabled={saving}>
              {saving ? 'Creating…' : 'Create Admin'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['Name', 'name', 'Full name'], ['Email', 'email', 'admin@example.com'], ['Password', 'password', 'Min 6 characters']].map(([label, k, ph]) => (
            <div key={k} className="form-group">
              <label className="form-label">{label} *</label>
              <input className="form-input" type={k === 'password' ? 'password' : 'text'} placeholder={ph}
                value={adminForm[k]} onChange={e => setAdminForm(f => ({ ...f, [k]: e.target.value }))} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Role *</label>
            <select className="form-select" value={adminForm.role_id} onChange={e => setAdminForm(f => ({ ...f, role_id: e.target.value }))}>
              <option value="">Select a role</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteRole}
        title="Delete Role" message={`Delete role "${deleteTarget?.name}"?`} confirmLabel="Delete" danger />

      <ConfirmDialog
        open={!!deleteAdminTarget}
        onClose={() => setDeleteAdminTarget(null)}
        onConfirm={handleDeleteAdmin}
        title="Delete Admin User"
        message={`Are you sure you want to delete "${deleteAdminTarget?.name}" (${deleteAdminTarget?.email})? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  )
}

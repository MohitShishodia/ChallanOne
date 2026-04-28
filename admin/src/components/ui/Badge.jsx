// Status Badge component
export default function Badge({ status, children, color }) {
  // Auto-map common statuses to badge classes
  const AUTO_MAP = {
    active: 'badge-success',
    inactive: 'badge-gray',
    paid: 'badge-success', PAID: 'badge-success',
    pending: 'badge-warning', PENDING: 'badge-warning',
    overdue: 'badge-danger', OVERDUE: 'badge-danger',
    refunded: 'badge-info', REFUNDED: 'badge-info',
    success: 'badge-success', SUCCESS: 'badge-success',
    failed: 'badge-danger', FAILED: 'badge-danger',
    open: 'badge-warning',
    in_progress: 'badge-info',
    resolved: 'badge-success',
    closed: 'badge-gray',
    high: 'badge-danger',
    medium: 'badge-warning',
    low: 'badge-gray',
    published: 'badge-success',
    draft: 'badge-gray',
    archived: 'badge-purple',
    featured: 'badge-purple'
  }

  const cls = color
    ? `badge badge-${color}`
    : `badge ${AUTO_MAP[status] || AUTO_MAP[children] || 'badge-gray'}`

  return (
    <span className={cls}>
      {children || status}
    </span>
  )
}

// Dot indicator
export function StatusDot({ status }) {
  const colors = {
    active: '#10b981', inactive: '#94a3b8',
    paid: '#10b981', PAID: '#10b981',
    pending: '#f59e0b', PENDING: '#f59e0b',
    overdue: '#ef4444', OVERDUE: '#ef4444',
    open: '#f59e0b', in_progress: '#06b6d4',
    resolved: '#10b981', closed: '#94a3b8'
  }

  return (
    <span style={{
      display: 'inline-block',
      width: 8, height: 8,
      borderRadius: '50%',
      background: colors[status] || '#94a3b8',
      marginRight: 6
    }} />
  )
}

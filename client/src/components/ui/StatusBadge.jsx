const statusClassMap = {
  PENDING: 'badge-pending',
  OVERDUE: 'badge-overdue',
  PAID: 'badge-paid',
}

export default function StatusBadge({ status = 'PENDING' }) {
  const resolved = (status || 'PENDING').toUpperCase()
  const styleClass = statusClassMap[resolved] || 'badge-pending'
  return <span className={styleClass}>{resolved}</span>
}

// Reusable Modal component
import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const maxWidths = { sm: 400, md: 540, lg: 720, xl: 900 }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className="modal animate-slide-up" style={{ maxWidth: maxWidths[size] }}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

// Confirm dialog
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || 'Confirm Action'}
      size="sm"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>{message}</p>
    </Modal>
  )
}

// مكوّنات واجهة صغيرة مشتركة
import { STATUS_LABELS, ROLE_LABELS } from '../lib/format'

export function Loading({ text = 'جارٍ التحميل…' }) {
  return (
    <div className="center-screen">
      <div className="spinner" />
      <p className="text-soft">{text}</p>
    </div>
  )
}

export function StatusBadge({ status }) {
  const cls =
    status === 'approved'
      ? 'badge-approved'
      : status === 'rejected'
        ? 'badge-rejected'
        : 'badge-pending'
  const icon = status === 'approved' ? '✅' : status === 'rejected' ? '🚫' : '⏳'
  return (
    <span className={`badge ${cls}`}>
      {icon} {STATUS_LABELS[status] || status}
    </span>
  )
}

export function RoleBadge({ role }) {
  return <span className="badge badge-role">{ROLE_LABELS[role] || role}</span>
}

export function Alert({ type = 'info', children }) {
  const icon =
    type === 'error' ? '⚠️' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'
  return (
    <div className={`alert alert-${type}`}>
      <span>{icon}</span>
      <span>{children}</span>
    </div>
  )
}

export function Empty({ emoji = '🍽️', title, children }) {
  return (
    <div className="empty">
      <span className="emoji">{emoji}</span>
      {title && <h3>{title}</h3>}
      {children && <p className="text-soft">{children}</p>}
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row-between mb">
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="btn btn-soft btn-sm" onClick={onClose} aria-label="إغلاق">
            إغلاق ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

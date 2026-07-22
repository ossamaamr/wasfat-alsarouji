// مكوّنات واجهة صغيرة مشتركة
import { STATUS_LABELS, ROLE_LABELS } from '../lib/format'
import Icon from './Icon'

export function Loading({ text = 'جارٍ التحميل…' }) {
  return (
    <div className="center-screen">
      <div className="spinner" />
      <p className="text-soft">{text}</p>
    </div>
  )
}

export function StatusBadge({ status }) {
  const map = {
    approved: { cls: 'badge-approved', icon: 'checkCircle' },
    rejected: { cls: 'badge-rejected', icon: 'xCircle' },
    pending: { cls: 'badge-pending', icon: 'hourglass' },
  }
  const { cls, icon } = map[status] || map.pending
  return (
    <span className={`badge ${cls}`}>
      <Icon name={icon} /> {STATUS_LABELS[status] || status}
    </span>
  )
}

export function RoleBadge({ role }) {
  const icon = role === 'admin' ? 'shield' : role === 'supervisor' ? 'eye' : 'user'
  return (
    <span className="badge badge-role">
      <Icon name={icon} /> {ROLE_LABELS[role] || role}
    </span>
  )
}

export function Alert({ type = 'info', children }) {
  const icon =
    type === 'error' ? 'alert' : type === 'success' ? 'checkCircle' : type === 'warning' ? 'alert' : 'info'
  return (
    <div className={`alert alert-${type}`}>
      <Icon name={icon} size={20} style={{ flexShrink: 0, marginTop: 2 }} />
      <span>{children}</span>
    </div>
  )
}

export function Empty({ icon = 'pot', title, children }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Icon name={icon} strokeWidth={1.6} />
      </div>
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
          <button className="btn btn-soft btn-sm" onClick={onClose} aria-label="إغلاق" style={{ width: 'auto' }}>
            <Icon name="x" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

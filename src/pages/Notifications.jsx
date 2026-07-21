import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Loading, Empty, Alert } from '../components/ui'
import { timeAgo } from '../lib/format'

const TYPE_ICON = {
  recipe_approved: '✅',
  recipe_pending: '⏳',
  suggestion: '💡',
  system: '🔔',
}

export default function Notifications() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    try {
      const data = await fetchNotifications(session.user.id)
      setItems(data)
    } catch {
      setError('تعذّر تحميل الإشعارات.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // عند فتح الشاشة نُعلّم الكل كمقروء
    markAllNotificationsRead(session.user.id).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  async function openNotification(n) {
    if (!n.is_read) {
      markNotificationRead(n.id).catch(() => {})
      setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
    }
    if (n.recipe_id) navigate(`/recipe/${n.recipe_id}`)
  }

  if (loading) return <Loading />

  return (
    <div className="page">
      <div className="page-header">
        <h1>🔔 الإشعارات</h1>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {items.length === 0 ? (
        <Empty emoji="🔕" title="لا إشعارات بعد">
          ستصلك هنا تنبيهات عند اعتماد وصفة جديدة.
        </Empty>
      ) : (
        <div className="stack" style={{ gap: 8 }}>
          {items.map((n) => (
            <div
              key={n.id}
              className="card"
              onClick={() => openNotification(n)}
              style={{
                padding: '14px 16px',
                cursor: n.recipe_id ? 'pointer' : 'default',
                borderInlineStart: n.is_read ? undefined : '4px solid var(--color-primary)',
                background: n.is_read ? undefined : 'var(--color-primary-soft)',
              }}
            >
              <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem' }}>{TYPE_ICON[n.type] || '🔔'}</span>
                <div className="grow">
                  <p style={{ margin: 0, fontWeight: 700 }}>{n.title || 'إشعار'}</p>
                  {n.body && <p className="text-soft" style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{n.body}</p>}
                  <p className="text-soft" style={{ margin: '6px 0 0', fontSize: '0.78rem' }}>{timeAgo(n.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

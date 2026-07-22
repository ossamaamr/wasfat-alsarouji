import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchMyRecipes } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Loading, Empty, StatusBadge, Alert } from '../components/ui'
import Icon from '../components/Icon'
import { formatDate } from '../lib/format'

export default function MyRecipes() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await fetchMyRecipes(session.user.id)
        if (active) setRecipes(data)
      } catch {
        if (active) setError('تعذّر تحميل وصفاتك.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [session])

  if (loading) return <Loading />

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="row" style={{ gap: 8 }}><Icon name="book" size={24} /> وصفاتي</h1>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {recipes.length === 0 ? (
        <Empty icon="book" title="لم تضف أي وصفة بعد">
          ابدأ بمشاركة وصفة تحبها مع العائلة.
        </Empty>
      ) : (
        <div className="stack">
          {recipes.map((r) => (
            <div key={r.id} className="card recipe-card" onClick={() => navigate(`/recipe/${r.id}`)}>
              <div className="body">
                <div className="row-between wrap" style={{ gap: 8 }}>
                  <h3 style={{ margin: 0 }}>{r.title}</h3>
                  <StatusBadge status={r.status} />
                </div>
                <div className="row-between text-soft" style={{ fontSize: '0.85rem', marginTop: 6 }}>
                  <span>{r.category?.name || 'بدون تصنيف'}</span>
                  <span>{formatDate(r.created_at)}</span>
                </div>
                {r.status === 'rejected' && (
                  <p className="text-soft" style={{ fontSize: '0.85rem', marginTop: 8, marginBottom: 0 }}>
                    يمكنك تعديلها وإعادة إرسالها للمراجعة.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-primary mt-lg" onClick={() => navigate('/add')}>
        <Icon name="plus" /> إضافة وصفة جديدة
      </button>
    </div>
  )
}

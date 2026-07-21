import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPendingRecipes, approveRecipe, rejectRecipe } from '../lib/api'
import { Loading, Empty, Alert } from '../components/ui'
import { formatDate, toLines } from '../lib/format'

export default function Review() {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [expanded, setExpanded] = useState(null)

  async function load() {
    try {
      const data = await fetchPendingRecipes()
      setRecipes(data)
    } catch {
      setError('تعذّر تحميل الوصفات قيد المراجعة.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleApprove(id) {
    setBusyId(id)
    setError('')
    try {
      await approveRecipe(id)
      setRecipes((rs) => rs.filter((r) => r.id !== id))
    } catch (err) {
      setError(err?.message || 'تعذّر الاعتماد.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(id) {
    if (!window.confirm('هل أنت متأكد من إلغاء هذه الوصفة؟ سيتمكّن صاحبها من تعديلها لاحقًا.')) return
    setBusyId(id)
    setError('')
    try {
      await rejectRecipe(id)
      setRecipes((rs) => rs.filter((r) => r.id !== id))
    } catch (err) {
      setError(err?.message || 'تعذّر الإلغاء.')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-soft btn-sm" onClick={() => navigate('/more')}>→ رجوع</button>
        <h1>🕵️ المراجعة</h1>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {recipes.length === 0 ? (
        <Empty emoji="✅" title="لا يوجد ما يحتاج مراجعة">
          كل الوصفات تمّت مراجعتها. عمل رائع!
        </Empty>
      ) : (
        <div className="stack">
          {recipes.map((r) => {
            const open = expanded === r.id
            const busy = busyId === r.id
            return (
              <div key={r.id} className="card" style={{ padding: 16 }}>
                <div className="row-between wrap" style={{ gap: 8, marginBottom: 8 }}>
                  <h3 style={{ margin: 0 }}>{r.title}</h3>
                  <span className="badge badge-pending">⏳ بانتظار الاعتماد</span>
                </div>
                <div className="row wrap text-soft" style={{ fontSize: '0.85rem', marginBottom: 10 }}>
                  {r.category?.name && <span className="chip">{r.category.name}</span>}
                  {r.author?.display_name && <span>👩‍🍳 {r.author.display_name}</span>}
                  <span>· {formatDate(r.created_at)}</span>
                </div>

                {r.image_url && (
                  <img
                    src={r.image_url}
                    alt={r.title}
                    style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: 10, aspectRatio: '16/10', objectFit: 'cover' }}
                  />
                )}

                <button
                  className="btn btn-ghost btn-sm mb"
                  onClick={() => setExpanded(open ? null : r.id)}
                >
                  {open ? 'إخفاء التفاصيل' : 'عرض المكوّنات والخطوات'}
                </button>

                {open && (
                  <div className="mb">
                    <h4>المكوّنات</h4>
                    <ul className="ingredients-list">
                      {toLines(r.ingredients).map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                    <h4 className="mt">الخطوات</h4>
                    <ol className="steps-list">
                      {toLines(r.steps).map((l, i) => <li key={i}>{l}</li>)}
                    </ol>
                  </div>
                )}

                <div className="stack" style={{ gap: 8 }}>
                  <button className="btn btn-accent" disabled={busy} onClick={() => handleApprove(r.id)}>
                    {busy ? '…' : '✅ اعتماد'}
                  </button>
                  <div className="row" style={{ gap: 8 }}>
                    <button
                      className="btn btn-soft"
                      disabled={busy}
                      onClick={() => navigate(`/edit/${r.id}`)}
                    >
                      ✏️ تعديل واعتماد
                    </button>
                    <button className="btn btn-danger" disabled={busy} onClick={() => handleReject(r.id)}>
                      🚫 إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

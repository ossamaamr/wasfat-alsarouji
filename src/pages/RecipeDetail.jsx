import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchRecipeById, approveRecipe, rejectRecipe } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Loading, Empty, StatusBadge, Alert } from '../components/ui'
import { formatDate, toLines } from '../lib/format'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, isSupervisor } = useAuth()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewError, setReviewError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await fetchRecipeById(id)
        if (!active) return
        if (!data) setNotFound(true)
        else setRecipe(data)
      } catch {
        if (active) setNotFound(true)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  if (loading) return <Loading />
  if (notFound || !recipe) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn btn-soft btn-sm" onClick={() => navigate(-1)}>→ رجوع</button>
        </div>
        <Empty emoji="🔍" title="الوصفة غير موجودة">
          قد تكون محذوفة أو غير متاحة دون اتصال.
        </Empty>
      </div>
    )
  }

  const ingredients = toLines(recipe.ingredients)
  const steps = toLines(recipe.steps)
  const isOwner = recipe.author_id === session?.user?.id
  const canEdit = isOwner || isSupervisor
  const canReview = isSupervisor && recipe.status === 'pending'

  async function handleApprove() {
    setReviewBusy(true)
    setReviewError('')
    try {
      const updated = await approveRecipe(recipe.id)
      setRecipe((r) => ({ ...r, ...updated }))
    } catch (err) {
      setReviewError(err?.message || 'تعذّر الاعتماد.')
    } finally {
      setReviewBusy(false)
    }
  }

  async function handleReject() {
    if (!window.confirm('هل أنت متأكد من إلغاء هذه الوصفة؟')) return
    setReviewBusy(true)
    setReviewError('')
    try {
      const updated = await rejectRecipe(recipe.id)
      setRecipe((r) => ({ ...r, ...updated }))
    } catch (err) {
      setReviewError(err?.message || 'تعذّر الإلغاء.')
    } finally {
      setReviewBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-soft btn-sm" onClick={() => navigate(-1)}>→ رجوع</button>
        <div className="grow" />
        {canEdit && (
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/edit/${recipe.id}`)}>
            ✏️ تعديل
          </button>
        )}
      </div>

      {recipe.image_url && (
        <img
          src={recipe.image_url}
          alt={recipe.title}
          style={{ width: '100%', borderRadius: 'var(--radius)', marginBottom: 16, aspectRatio: '16/10', objectFit: 'cover' }}
        />
      )}

      <div className="row-between wrap" style={{ marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>{recipe.title}</h1>
        {recipe.status !== 'approved' && <StatusBadge status={recipe.status} />}
      </div>

      <div className="row wrap text-soft" style={{ fontSize: '0.9rem', marginBottom: 20 }}>
        {recipe.category?.name && <span className="chip">{recipe.category.name}</span>}
        {recipe.author?.display_name && <span>👩‍🍳 {recipe.author.display_name}</span>}
        {recipe.created_at && <span>· {formatDate(recipe.created_at)}</span>}
      </div>

      {canReview && (
        <div className="card" style={{ padding: 16, marginBottom: 16, background: 'var(--color-warning-soft)' }}>
          <p style={{ marginTop: 0, fontWeight: 700 }}>هذه الوصفة تنتظر قرارك:</p>
          {reviewError && <Alert type="error">{reviewError}</Alert>}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-accent" disabled={reviewBusy} onClick={handleApprove}>
              ✅ اعتماد
            </button>
            <button className="btn btn-danger" disabled={reviewBusy} onClick={handleReject}>
              🚫 إلغاء
            </button>
          </div>
        </div>
      )}

      {ingredients.length > 0 && (
        <section className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
          <h2>🧺 المكوّنات</h2>
          <ul className="ingredients-list">
            {ingredients.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </section>
      )}

      {steps.length > 0 && (
        <section className="card" style={{ padding: '16px 18px' }}>
          <h2>👩‍🍳 طريقة التحضير</h2>
          <ol className="steps-list">
            {steps.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </section>
      )}

      {recipe.updated_at && recipe.updated_at !== recipe.created_at && (
        <p className="text-soft text-center mt" style={{ fontSize: '0.82rem' }}>
          آخر تعديل: {formatDate(recipe.updated_at)}
        </p>
      )}
    </div>
  )
}

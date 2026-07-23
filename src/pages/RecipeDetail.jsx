import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchRecipeById, approveRecipe, rejectRecipe, deleteRecipe,
  fetchFavoriteIds, toggleFavorite,
} from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Loading, Empty, StatusBadge, Alert } from '../components/ui'
import Icon from '../components/Icon'
import Countdown from '../components/Countdown'
import Comments from '../components/Comments'
import { formatDate, toLines, parseMinutes } from '../lib/format'

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { session, isSupervisor, isAdmin } = useAuth()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [favBusy, setFavBusy] = useState(false)
  const [timer, setTimer] = useState(null) // { minutes, label }

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
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!session?.user) return
    fetchFavoriteIds(session.user.id).then((set) => setIsFav(set.has(id))).catch(() => {})
  }, [id, session])

  async function toggleFav() {
    setFavBusy(true)
    try {
      const now = await toggleFavorite(id, session.user.id, isFav)
      setIsFav(now)
    } catch { /* تجاهل */ } finally {
      setFavBusy(false)
    }
  }

  if (loading) return <Loading />
  if (notFound || !recipe) {
    return (
      <div className="page">
        <div className="page-header">
          <button className="btn btn-soft btn-sm" style={{ width: 'auto' }} onClick={() => navigate(-1)}><Icon name="back" size={18} /> رجوع</button>
        </div>
        <Empty icon="search" title="الوصفة غير موجودة">
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
  const canDelete = isAdmin || (isOwner && recipe.status !== 'approved')

  async function handleDelete() {
    if (!window.confirm('هل تريد حذف هذه الوصفة نهائيًا؟ لا يمكن التراجع.')) return
    setDeleting(true); setReviewError('')
    try {
      await deleteRecipe(recipe.id)
      navigate('/', { replace: true })
    } catch (err) {
      setReviewError(err?.message || 'تعذّر حذف الوصفة.'); setDeleting(false)
    }
  }
  async function handleApprove() {
    setReviewBusy(true); setReviewError('')
    try {
      const updated = await approveRecipe(recipe.id)
      setRecipe((r) => ({ ...r, ...updated }))
    } catch (err) { setReviewError(err?.message || 'تعذّر الاعتماد.') } finally { setReviewBusy(false) }
  }
  async function handleReject() {
    if (!window.confirm('هل أنت متأكد من إلغاء هذه الوصفة؟')) return
    setReviewBusy(true); setReviewError('')
    try {
      const updated = await rejectRecipe(recipe.id)
      setRecipe((r) => ({ ...r, ...updated }))
    } catch (err) { setReviewError(err?.message || 'تعذّر الإلغاء.') } finally { setReviewBusy(false) }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-soft btn-sm" style={{ width: 'auto' }} onClick={() => navigate(-1)}><Icon name="back" size={18} /> رجوع</button>
        <div className="grow" />
        <button className="btn btn-soft btn-sm" style={{ width: 'auto' }} onClick={toggleFav} disabled={favBusy} aria-label="المفضّلة">
          <Icon name="heart" size={20} fill={isFav ? 'var(--color-danger)' : 'none'} style={{ color: 'var(--color-danger)' }} />
        </button>
        {canEdit && (
          <button className="btn btn-ghost btn-sm" style={{ width: 'auto' }} onClick={() => navigate(`/edit/${recipe.id}`)}>
            <Icon name="edit" size={18} /> تعديل
          </button>
        )}
      </div>

      {recipe.image_url && (
        <img src={recipe.image_url} alt={recipe.title}
          style={{ width: '100%', borderRadius: 'var(--radius)', marginBottom: 16, aspectRatio: '16/10', objectFit: 'cover' }} />
      )}

      <div className="row-between wrap" style={{ marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>{recipe.title}</h1>
        {recipe.status !== 'approved' && <StatusBadge status={recipe.status} />}
      </div>

      <div className="row wrap text-soft" style={{ fontSize: '0.9rem', marginBottom: 20 }}>
        {recipe.category?.name && <span className="chip">{recipe.category.name}</span>}
        {recipe.author?.display_name && (
          <span className="row" style={{ gap: 5 }}><Icon name="chef" size={17} /> {recipe.author.display_name}</span>
        )}
        {recipe.created_at && <span>· {formatDate(recipe.created_at)}</span>}
      </div>

      {canReview && (
        <div className="card" style={{ padding: 16, marginBottom: 16, background: 'var(--color-warning-soft)' }}>
          <p style={{ marginTop: 0, fontWeight: 700 }}>هذه الوصفة تنتظر قرارك:</p>
          {reviewError && <Alert type="error">{reviewError}</Alert>}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-accent" disabled={reviewBusy} onClick={handleApprove}><Icon name="check" /> اعتماد</button>
            <button className="btn btn-danger" disabled={reviewBusy} onClick={handleReject}><Icon name="ban" /> إلغاء</button>
          </div>
        </div>
      )}

      {ingredients.length > 0 && (
        <section className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
          <h2 className="row" style={{ gap: 8 }}><Icon name="list" size={22} /> المكوّنات</h2>
          <ul className="ingredients-list">
            {ingredients.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        </section>
      )}

      {steps.length > 0 && (
        <section className="card" style={{ padding: '16px 18px' }}>
          <h2 className="row" style={{ gap: 8 }}><Icon name="chef" size={22} /> طريقة التحضير</h2>
          <ol className="steps-list">
            {steps.map((line, i) => {
              const mins = parseMinutes(line)
              return (
                <li key={i}>
                  <div>
                    <span>{line}</span>
                    {mins && (
                      <button
                        className="chip"
                        style={{ marginInlineStart: 10, padding: '4px 12px', color: 'var(--color-primary)', borderColor: 'var(--color-primary-soft)' }}
                        onClick={() => setTimer({ minutes: mins, label: line })}
                      >
                        <Icon name="timer" size={16} /> {mins} دقيقة
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      )}

      {recipe.status === 'approved' && <Comments recipeId={recipe.id} />}

      {recipe.updated_at && recipe.updated_at !== recipe.created_at && (
        <p className="text-soft text-center mt" style={{ fontSize: '0.82rem' }}>آخر تعديل: {formatDate(recipe.updated_at)}</p>
      )}

      {canDelete && (
        <div className="mt-lg">
          {reviewError && !canReview && <Alert type="error">{reviewError}</Alert>}
          <button className="btn btn-ghost" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger-soft)' }} disabled={deleting} onClick={handleDelete}>
            <Icon name="trash" /> {deleting ? 'جارٍ الحذف…' : 'حذف الوصفة'}
          </button>
        </div>
      )}

      {timer && <Countdown minutes={timer.minutes} label={timer.label} onClose={() => setTimer(null)} />}
    </div>
  )
}

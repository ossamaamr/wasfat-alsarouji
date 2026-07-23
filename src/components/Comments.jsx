import { useEffect, useState } from 'react'
import { fetchComments, addComment, deleteComment } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'
import { timeAgo } from '../lib/format'

export default function Comments({ recipeId }) {
  const { session, isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    fetchComments(recipeId)
      .then((d) => active && setItems(d))
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [recipeId])

  async function submit(e) {
    e.preventDefault()
    if (body.trim().length < 1) return
    setBusy(true)
    try {
      const c = await addComment(recipeId, body)
      setItems((xs) => [...xs, c])
      setBody('')
    } catch { /* تجاهل */ } finally {
      setBusy(false)
    }
  }

  async function remove(id) {
    if (!window.confirm('حذف التعليق؟')) return
    try {
      await deleteComment(id)
      setItems((xs) => xs.filter((x) => x.id !== id))
    } catch { /* تجاهل */ }
  }

  return (
    <section className="card" style={{ padding: '16px 18px', marginTop: 16 }}>
      <h2 className="row" style={{ gap: 8 }}>
        <Icon name="bulb" size={22} /> تعليقات العائلة {items.length > 0 && `(${items.length})`}
      </h2>

      {!loading && items.length === 0 && (
        <p className="text-soft" style={{ fontSize: '0.9rem' }}>كن أول من يشارك ملاحظة أو تعديلًا على الوصفة.</p>
      )}

      <div className="stack" style={{ gap: 10, marginTop: 10 }}>
        {items.map((c) => (
          <div key={c.id} style={{ borderInlineStart: '3px solid var(--color-border)', paddingInlineStart: 12 }}>
            <div className="row-between">
              <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{c.user?.display_name || 'عضو'}</span>
              <span className="row" style={{ gap: 8 }}>
                <span className="text-soft" style={{ fontSize: '0.75rem' }}>{timeAgo(c.created_at)}</span>
                {(c.user_id === session?.user?.id || isAdmin) && (
                  <button className="btn-soft" style={{ background: 'none', color: 'var(--color-text-soft)', padding: 0 }} onClick={() => remove(c.id)} aria-label="حذف">
                    <Icon name="trash" size={16} />
                  </button>
                )}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.95rem' }}>{c.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="row mt" style={{ gap: 8, alignItems: 'flex-end' }}>
        <input
          className="input grow"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="اكتب تعليقًا…"
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={busy} style={{ width: 'auto' }}>
          <Icon name="send" size={18} />
        </button>
      </form>
    </section>
  )
}

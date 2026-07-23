import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchApprovedRecipes, fetchCategories, fetchFavoriteIds } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Loading, Empty, Alert } from '../components/ui'
import Icon from '../components/Icon'
import Logo from '../components/Logo'

function RecipeCard({ recipe, onClick }) {
  return (
    <div className="card recipe-card" onClick={onClick}>
      {recipe.image_url ? (
        <img className="thumb" src={recipe.image_url} alt={recipe.title} loading="lazy" />
      ) : (
        <div className="thumb-placeholder">
          <Icon name="pot" strokeWidth={1.5} />
        </div>
      )}
      <div className="body">
        <h3>{recipe.title}</h3>
        <div className="row-between">
          <span className="text-soft" style={{ fontSize: '0.85rem' }}>
            {recipe.category?.name || 'بدون تصنيف'}
          </span>
          {recipe.author?.display_name && (
            <span className="text-soft row" style={{ fontSize: '0.85rem', gap: 5 }}>
              <Icon name="chef" size={16} /> {recipe.author.display_name}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [recipes, setRecipes] = useState([])
  const [categories, setCategories] = useState([])
  const [favIds, setFavIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState(null)
  const [showFavs, setShowFavs] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [{ data, offline: off }, cats, favs] = await Promise.all([
          fetchApprovedRecipes(),
          fetchCategories().catch(() => []),
          session?.user ? fetchFavoriteIds(session.user.id).catch(() => new Set()) : new Set(),
        ])
        if (!active) return
        setRecipes(data)
        setCategories(cats)
        setFavIds(favs)
        setOffline(off)
      } catch (err) {
        if (active) setError('تعذّر تحميل الوصفات. تحقّق من اتصالك.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [session])

  const filtered = useMemo(() => {
    const q = search.trim()
    return recipes.filter((r) => {
      if (showFavs && !favIds.has(r.id)) return false
      if (activeCat && r.category_id !== activeCat) return false
      if (q && !r.title.includes(q) && !(r.ingredients || '').includes(q)) return false
      return true
    })
  }, [recipes, search, activeCat, showFavs, favIds])

  if (loading) return <Loading />

  return (
    <div className="page">
      <div className="page-header">
        <Logo size={34} />
        <h1>وصفات العائلة</h1>
      </div>

      {offline && <Alert type="warning">وضع دون اتصال — تعرض الوصفات المحفوظة سابقًا.</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      <div className="search-box">
        <Icon name="search" size={20} />
        <input
          className="input"
          type="search"
          placeholder="ابحث عن وصفة أو مكوّن…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="chips-scroll">
        <button
          className={`chip ${showFavs ? 'active' : ''}`}
          onClick={() => setShowFavs((v) => !v)}
          style={showFavs ? { background: 'var(--color-danger)', borderColor: 'var(--color-danger)' } : undefined}
        >
          <Icon name="heart" size={16} fill={showFavs ? '#fff' : 'none'} /> المفضّلة
        </button>
        {categories.length > 0 && (
          <>
            <button className={`chip ${!activeCat ? 'active' : ''}`} onClick={() => setActiveCat(null)}>الكل</button>
            {categories.map((c) => (
              <button
                key={c.id}
                className={`chip ${activeCat === c.id ? 'active' : ''}`}
                onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
              >
                {c.name}
              </button>
            ))}
          </>
        )}
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon={showFavs ? 'heart' : 'pot'}
          title={showFavs ? 'لا مفضّلة بعد' : recipes.length === 0 ? 'لا توجد وصفات بعد' : 'لا نتائج'}
        >
          {showFavs
            ? 'اضغط ❤ داخل أي وصفة لإضافتها هنا.'
            : recipes.length === 0
              ? 'كن أول من يضيف وصفة العائلة! اضغط «إضافة» بالأسفل.'
              : 'جرّب كلمة بحث أخرى أو تصنيفًا مختلفًا.'}
        </Empty>
      ) : (
        <div className="stack">
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} onClick={() => navigate(`/recipe/${r.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

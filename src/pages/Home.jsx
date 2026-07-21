import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchApprovedRecipes, fetchCategories } from '../lib/api'
import { Loading, Empty, Alert } from '../components/ui'

function RecipeCard({ recipe, onClick }) {
  return (
    <div className="card recipe-card" onClick={onClick}>
      {recipe.image_url ? (
        <img className="thumb" src={recipe.image_url} alt={recipe.title} loading="lazy" />
      ) : (
        <div className="thumb-placeholder">🍽️</div>
      )}
      <div className="body">
        <h3>{recipe.title}</h3>
        <div className="row-between">
          <span className="text-soft" style={{ fontSize: '0.85rem' }}>
            {recipe.category?.name || 'بدون تصنيف'}
          </span>
          <span className="text-soft" style={{ fontSize: '0.85rem' }}>
            {recipe.author?.display_name ? `👩‍🍳 ${recipe.author.display_name}` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [recipes, setRecipes] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [offline, setOffline] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const [{ data, offline: off }, cats] = await Promise.all([
          fetchApprovedRecipes(),
          fetchCategories().catch(() => []),
        ])
        if (!active) return
        setRecipes(data)
        setCategories(cats)
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
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim()
    return recipes.filter((r) => {
      if (activeCat && r.category_id !== activeCat) return false
      if (q && !r.title.includes(q) && !(r.ingredients || '').includes(q)) return false
      return true
    })
  }, [recipes, search, activeCat])

  if (loading) return <Loading />

  return (
    <div className="page">
      <div className="page-header">
        <h1>🍲 وصفات العائلة</h1>
      </div>

      {offline && <Alert type="warning">وضع دون اتصال — تعرض الوصفات المحفوظة سابقًا.</Alert>}
      {error && <Alert type="error">{error}</Alert>}

      <div className="field" style={{ marginBottom: 12 }}>
        <input
          className="input"
          type="search"
          placeholder="🔎 ابحث عن وصفة أو مكوّن…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {categories.length > 0 && (
        <div className="chips-scroll">
          <button
            className={`chip ${!activeCat ? 'active' : ''}`}
            onClick={() => setActiveCat(null)}
          >
            الكل
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`chip ${activeCat === c.id ? 'active' : ''}`}
              onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Empty
          emoji="🥘"
          title={recipes.length === 0 ? 'لا توجد وصفات بعد' : 'لا نتائج'}
        >
          {recipes.length === 0
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

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  fetchCategories,
  createRecipe,
  updateRecipe,
  fetchRecipeById,
  uploadRecipeImage,
} from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Alert, Loading } from '../components/ui'

export default function RecipeForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { session } = useAuth()

  const [categories, setCategories] = useState([])
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [steps, setSteps] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const cats = await fetchCategories()
        if (!active) return
        setCategories(cats)
        if (isEdit) {
          const r = await fetchRecipeById(id)
          if (!active) return
          setTitle(r.title || '')
          setCategoryId(r.category_id || '')
          setIngredients(r.ingredients || '')
          setSteps(r.steps || '')
          setImageUrl(r.image_url || '')
          setPreview(r.image_url || '')
        }
      } catch {
        if (active) setError('تعذّر تحميل البيانات.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id, isEdit])

  function onPickImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الصورة كبير (الحد 5 ميجابايت). اختر صورة أصغر.')
      return
    }
    setError('')
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('الرجاء كتابة عنوان الوصفة.')
    if (!ingredients.trim()) return setError('الرجاء إدخال المكوّنات.')
    if (!steps.trim()) return setError('الرجاء إدخال خطوات التحضير.')

    setBusy(true)
    try {
      let finalImage = imageUrl
      if (imageFile) {
        finalImage = await uploadRecipeImage(imageFile, session.user.id)
      }

      const payload = {
        title: title.trim(),
        category_id: categoryId || null,
        ingredients: ingredients.trim(),
        steps: steps.trim(),
        image_url: finalImage || null,
      }

      if (isEdit) {
        await updateRecipe(id, payload)
        navigate(`/recipe/${id}`, { replace: true })
      } else {
        const created = await createRecipe({ ...payload, author_id: session.user.id })
        navigate(`/recipe/${created.id}`, { replace: true })
      }
    } catch (err) {
      setError(err?.message || 'تعذّر حفظ الوصفة. حاول مجددًا.')
      setBusy(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-soft btn-sm" onClick={() => navigate(-1)}>→ رجوع</button>
        <h1>{isEdit ? '✏️ تعديل الوصفة' : '➕ وصفة جديدة'}</h1>
      </div>

      {!isEdit && (
        <Alert type="info">ستُرسَل وصفتك للمراجعة، وتظهر للعائلة بعد اعتمادها من المشرف.</Alert>
      )}
      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="title">عنوان الوصفة</label>
          <input
            id="title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: كبسة الدجاج"
          />
        </div>

        <div className="field">
          <label htmlFor="cat">التصنيف</label>
          <select id="cat" className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">— بدون تصنيف —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="ing">
            المكوّنات
            <span className="hint"> — كل مكوّن في سطر</span>
          </label>
          <textarea
            id="ing"
            className="textarea"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder={'كوب أرز\nنصف كيلو دجاج\nبصلة كبيرة'}
          />
        </div>

        <div className="field">
          <label htmlFor="steps">
            خطوات التحضير
            <span className="hint"> — كل خطوة في سطر</span>
          </label>
          <textarea
            id="steps"
            className="textarea"
            style={{ minHeight: 160 }}
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder={'اغسلي الأرز وانقعيه\nحمّري البصل\n...'}
          />
        </div>

        <div className="field">
          <label>صورة الوصفة <span className="hint">— اختياري</span></label>
          {preview && (
            <img
              src={preview}
              alt="معاينة"
              style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: 10, aspectRatio: '16/10', objectFit: 'cover' }}
            />
          )}
          <label className="btn btn-soft" style={{ cursor: 'pointer' }}>
            📷 {preview ? 'تغيير الصورة' : 'إضافة صورة'}
            <input type="file" accept="image/*" hidden onChange={onPickImage} />
          </label>
        </div>

        <button className="btn btn-primary mt" type="submit" disabled={busy}>
          {busy ? 'جارٍ الحفظ…' : isEdit ? 'حفظ التعديلات' : 'إرسال للمراجعة'}
        </button>
      </form>
    </div>
  )
}

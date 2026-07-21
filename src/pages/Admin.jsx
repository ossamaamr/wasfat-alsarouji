import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchUsers,
  adminCreateUser,
  updateUserRole,
  updateUserStatus,
  fetchSuggestions,
  fetchCategories,
  createCategory,
  deleteCategory,
} from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { Loading, Alert, Empty, RoleBadge, Modal } from '../components/ui'
import { ROLE_LABELS, USER_STATUS_LABELS, timeAgo } from '../lib/format'

// ── تبويب المستخدمين ──
function UsersTab() {
  const { profile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [created, setCreated] = useState(null)

  async function load() {
    try {
      setUsers(await fetchUsers())
    } catch {
      setError('تعذّر تحميل المستخدمين.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  async function changeRole(u, role) {
    try {
      await updateUserRole(u.id, role)
      setUsers((xs) => xs.map((x) => (x.id === u.id ? { ...x, role } : x)))
    } catch (err) {
      setError(err?.message || 'تعذّر تغيير الدور.')
    }
  }
  async function toggleStatus(u) {
    const next = u.status === 'disabled' ? 'active' : 'disabled'
    try {
      await updateUserStatus(u.id, next)
      setUsers((xs) => xs.map((x) => (x.id === u.id ? { ...x, status: next } : x)))
    } catch (err) {
      setError(err?.message || 'تعذّر تغيير الحالة.')
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      {error && <Alert type="error">{error}</Alert>}

      <button className="btn btn-primary mb" onClick={() => setShowCreate(true)}>
        ➕ إنشاء معرّف جديد
      </button>

      {created && (
        <Alert type="success">
          تم إنشاء الحساب. سلّم هذه البيانات للعضو:<br />
          المعرّف: <b dir="ltr">{created.login_id}</b><br />
          كلمة المرور المؤقتة: <b dir="ltr">{created.temp_password}</b>
        </Alert>
      )}

      <div className="stack" style={{ gap: 10 }}>
        {users.map((u) => (
          <div key={u.id} className="card" style={{ padding: 14 }}>
            <div className="row-between wrap" style={{ gap: 8 }}>
              <div>
                <div style={{ fontWeight: 800 }}>{u.display_name || '— بانتظار الإعداد —'}</div>
                <div className="text-soft" dir="ltr" style={{ textAlign: 'right', fontSize: '0.82rem' }}>{u.login_id}</div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <RoleBadge role={u.role} />
                <span className={`badge ${u.status === 'active' ? 'badge-approved' : u.status === 'disabled' ? 'badge-rejected' : 'badge-pending'}`}>
                  {USER_STATUS_LABELS[u.status]}
                </span>
              </div>
            </div>

            {u.id !== profile.id && (
              <div className="row wrap mt" style={{ gap: 8 }}>
                <select
                  className="select"
                  style={{ minHeight: 42, width: 'auto', flex: '1 1 140px' }}
                  value={u.role}
                  onChange={(e) => changeRole(u, e.target.value)}
                >
                  <option value="member">{ROLE_LABELS.member}</option>
                  <option value="supervisor">{ROLE_LABELS.supervisor}</option>
                  <option value="admin">{ROLE_LABELS.admin}</option>
                </select>
                <button
                  className={`btn btn-sm ${u.status === 'disabled' ? 'btn-accent' : 'btn-danger'}`}
                  onClick={() => toggleStatus(u)}
                >
                  {u.status === 'disabled' ? 'تفعيل' : 'تعطيل'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={(res) => {
            setCreated(res)
            setShowCreate(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function CreateUserModal({ onClose, onCreated }) {
  const [loginId, setLoginId] = useState('')
  const [role, setRole] = useState('member')
  const [tempPassword, setTempPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!/^[a-z0-9._-]{3,}$/i.test(loginId.trim())) {
      return setError('المعرّف يجب أن يكون 3 أحرف/أرقام إنجليزية على الأقل (بدون مسافات).')
    }
    const pw = tempPassword.trim() || Math.random().toString(36).slice(-8)
    setBusy(true)
    try {
      const res = await adminCreateUser({ loginId: loginId.trim(), role, tempPassword: pw })
      onCreated({ login_id: loginId.trim(), temp_password: pw, ...res })
    } catch (err) {
      setError(err?.message || 'تعذّر إنشاء المستخدم.')
      setBusy(false)
    }
  }

  return (
    <Modal title="إنشاء معرّف جديد" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <Alert type="error">{error}</Alert>}
        <div className="field">
          <label>المعرّف <span className="hint">— أحرف/أرقام إنجليزية</span></label>
          <input className="input" dir="ltr" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="mohammed" />
        </div>
        <div className="field">
          <label>الدور</label>
          <select className="select" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="member">{ROLE_LABELS.member}</option>
            <option value="supervisor">{ROLE_LABELS.supervisor}</option>
            <option value="admin">{ROLE_LABELS.admin}</option>
          </select>
        </div>
        <div className="field">
          <label>كلمة مرور مؤقتة <span className="hint">— اتركها فارغة لتوليدها تلقائيًا</span></label>
          <input className="input" dir="ltr" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} placeholder="تُولّد تلقائيًا" />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'جارٍ الإنشاء…' : 'إنشاء'}
        </button>
      </form>
    </Modal>
  )
}

// ── تبويب الاقتراحات ──
function SuggestionsTab() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        setItems(await fetchSuggestions())
      } catch {
        setError('تعذّر تحميل الاقتراحات.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <Loading />
  if (error) return <Alert type="error">{error}</Alert>
  if (items.length === 0) return <Empty emoji="💡" title="لا اقتراحات بعد" />

  return (
    <div className="stack" style={{ gap: 10 }}>
      {items.map((s) => (
        <div key={s.id} className="card" style={{ padding: 16 }}>
          <p style={{ margin: 0 }}>{s.message}</p>
          <div className="row-between text-soft mt" style={{ fontSize: '0.82rem' }}>
            <span>👤 {s.user?.display_name || s.user?.login_id || 'غير معروف'}</span>
            <span>{timeAgo(s.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── تبويب التصنيفات ──
function CategoriesTab() {
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    try {
      setItems(await fetchCategories())
    } catch {
      setError('تعذّر تحميل التصنيفات.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault()
    if (!name.trim()) return
    try {
      const c = await createCategory(name)
      setItems((xs) => [...xs, c].sort((a, b) => a.name.localeCompare(b.name, 'ar')))
      setName('')
    } catch (err) {
      setError(err?.message || 'تعذّر إضافة التصنيف.')
    }
  }
  async function remove(id) {
    if (!window.confirm('حذف هذا التصنيف؟')) return
    try {
      await deleteCategory(id)
      setItems((xs) => xs.filter((x) => x.id !== id))
    } catch (err) {
      setError(err?.message || 'تعذّر الحذف (قد يكون مستخدمًا في وصفات).')
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      {error && <Alert type="error">{error}</Alert>}
      <form onSubmit={add} className="row mb" style={{ gap: 8 }}>
        <input className="input grow" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم تصنيف جديد" />
        <button className="btn btn-primary btn-sm" type="submit" style={{ width: 'auto' }}>إضافة</button>
      </form>
      <div className="stack" style={{ gap: 8 }}>
        {items.map((c) => (
          <div key={c.id} className="card row-between" style={{ padding: '12px 16px' }}>
            <span style={{ fontWeight: 700 }}>{c.name}</span>
            <button className="btn btn-soft btn-sm" style={{ width: 'auto' }} onClick={() => remove(c.id)}>حذف</button>
          </div>
        ))}
        {items.length === 0 && <Empty emoji="🏷️" title="لا تصنيفات بعد" />}
      </div>
    </div>
  )
}

export default function Admin() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('users')

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-soft btn-sm" onClick={() => navigate('/more')}>→ رجوع</button>
        <h1>⚙️ لوحة الأدمن</h1>
      </div>

      <div className="chips-scroll">
        <button className={`chip ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>👥 المستخدمون</button>
        <button className={`chip ${tab === 'suggestions' ? 'active' : ''}`} onClick={() => setTab('suggestions')}>💡 الاقتراحات</button>
        <button className={`chip ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>🏷️ التصنيفات</button>
      </div>

      {tab === 'users' && <UsersTab />}
      {tab === 'suggestions' && <SuggestionsTab />}
      {tab === 'categories' && <CategoriesTab />}
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RoleBadge, Modal, Alert } from '../components/ui'
import Icon from '../components/Icon'
import { supabase } from '../lib/supabase'

function MenuLink({ icon, label, onClick, note }) {
  return (
    <button className="menu-link card" onClick={onClick}>
      <span className="menu-link-icon"><Icon name={icon} size={22} /></span>
      <span className="grow" style={{ fontWeight: 700 }}>{label}</span>
      {note != null && <span className="badge badge-pending">{note}</span>}
      <Icon name="back" size={18} style={{ transform: 'scaleX(-1)', color: 'var(--color-text-soft)' }} />
    </button>
  )
}

function Toggle({ icon, label, checked, onChange }) {
  return (
    <label className="card row-between" style={{ padding: '14px 18px', cursor: 'pointer' }}>
      <span className="row" style={{ gap: 10, fontWeight: 700 }}>
        <Icon name={icon} size={20} style={{ color: 'var(--color-text-soft)' }} /> {label}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 44, height: 26 }} />
    </label>
  )
}

// تعديل اسم العرض
function EditNameModal({ current, onClose, onSaved }) {
  const [name, setName] = useState(current || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save() {
    if (name.trim().length < 2) return setError('اكتب اسمًا صحيحًا.')
    setBusy(true); setError('')
    const { data: u } = await supabase.auth.getUser()
    const { error: e } = await supabase.from('users').update({ display_name: name.trim() }).eq('id', u.user.id)
    if (e) { setError(e.message); setBusy(false); return }
    await onSaved()
    onClose()
  }
  return (
    <Modal title="تعديل الاسم" onClose={onClose}>
      {error && <Alert type="error">{error}</Alert>}
      <div className="field">
        <label>الاسم كما يظهر للعائلة</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'جارٍ الحفظ…' : 'حفظ'}</button>
    </Modal>
  )
}

// تغيير كلمة المرور
function ChangePasswordModal({ onClose }) {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  async function save() {
    if (pw.length < 6) return setError('كلمة المرور 6 أحرف على الأقل.')
    if (pw !== confirm) return setError('كلمتا المرور غير متطابقتين.')
    setBusy(true); setError('')
    const { error: e } = await supabase.auth.updateUser({ password: pw })
    if (e) { setError(e.message); setBusy(false); return }
    setDone(true); setBusy(false)
  }
  return (
    <Modal title="تغيير كلمة المرور" onClose={onClose}>
      {done ? (
        <>
          <Alert type="success">تم تغيير كلمة المرور بنجاح.</Alert>
          <button className="btn btn-primary" onClick={onClose}>تمّ</button>
        </>
      ) : (
        <>
          {error && <Alert type="error">{error}</Alert>}
          <div className="field">
            <label>كلمة المرور الجديدة</label>
            <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="6 أحرف على الأقل" />
          </div>
          <div className="field">
            <label>تأكيد كلمة المرور</label>
            <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'جارٍ الحفظ…' : 'حفظ'}</button>
        </>
      )}
    </Modal>
  )
}

export default function More() {
  const navigate = useNavigate()
  const { profile, isSupervisor, isAdmin, signOut, refreshProfile } = useAuth()
  const [fontLarge, setFontLarge] = useState(localStorage.getItem('font-large') === '1')
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme-dark') === '1')
  const [modal, setModal] = useState(null) // 'name' | 'password'

  function toggleFont(v) {
    setFontLarge(v)
    document.documentElement.classList.toggle('font-large', v)
    localStorage.setItem('font-large', v ? '1' : '0')
  }
  function toggleDark(v) {
    setDarkMode(v)
    document.body.classList.toggle('theme-dark', v)
    localStorage.setItem('theme-dark', v ? '1' : '0')
  }
  async function handleLogout() {
    if (!window.confirm('هل تريد تسجيل الخروج؟')) return
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="row" style={{ gap: 8 }}><Icon name="menu" size={24} /> المزيد</h1>
      </div>

      <div className="card profile-card" style={{ padding: '18px', marginBottom: 20 }}>
        <div className="row" style={{ gap: 14 }}>
          <div className="profile-avatar"><Icon name="user" size={30} /></div>
          <div className="grow">
            <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{profile?.display_name || 'مستخدم'}</div>
            <div className="text-soft" dir="ltr" style={{ textAlign: 'right', fontSize: '0.85rem' }}>{profile?.login_id}</div>
          </div>
          <RoleBadge role={profile?.role} />
        </div>
      </div>

      <h3 className="mb">حسابي</h3>
      <div className="stack" style={{ gap: 10 }}>
        <MenuLink icon="edit" label="تعديل الاسم" onClick={() => setModal('name')} />
        <MenuLink icon="shield" label="تغيير كلمة المرور" onClick={() => setModal('password')} />
      </div>

      <h3 className="mt-lg mb">الأدوات</h3>
      <div className="stack" style={{ gap: 10 }}>
        {isSupervisor && <MenuLink icon="eye" label="مراجعة الوصفات" onClick={() => navigate('/review')} />}
        <MenuLink icon="bulb" label="إرسال اقتراح" onClick={() => navigate('/suggestions')} />
        {isAdmin && <MenuLink icon="settings" label="لوحة الأدمن" onClick={() => navigate('/admin')} />}
      </div>

      <h3 className="mt-lg mb">العرض</h3>
      <div className="stack" style={{ gap: 10 }}>
        <Toggle icon="text" label="تكبير حجم الخط" checked={fontLarge} onChange={toggleFont} />
        <Toggle icon="moon" label="الوضع الليلي" checked={darkMode} onChange={toggleDark} />
      </div>

      <button className="btn btn-ghost mt-lg" onClick={handleLogout} style={{ color: 'var(--color-danger)' }}>
        <Icon name="logout" /> تسجيل الخروج
      </button>

      <p className="text-center text-soft mt-lg" style={{ fontSize: '0.8rem' }}>
        وصفات أسرة السَّروجيُّ · أرشيف العائلة
      </p>

      {modal === 'name' && (
        <EditNameModal current={profile?.display_name} onClose={() => setModal(null)} onSaved={refreshProfile} />
      )}
      {modal === 'password' && <ChangePasswordModal onClose={() => setModal(null)} />}
    </div>
  )
}

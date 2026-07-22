import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RoleBadge } from '../components/ui'
import Icon from '../components/Icon'

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
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 44, height: 26 }}
      />
    </label>
  )
}

export default function More() {
  const navigate = useNavigate()
  const { profile, isSupervisor, isAdmin, signOut } = useAuth()
  const [fontLarge, setFontLarge] = useState(localStorage.getItem('font-large') === '1')
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme-dark') === '1')

  function toggleFont(v) {
    setFontLarge(v)
    document.body.classList.toggle('font-large', v)
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

      <div className="stack" style={{ gap: 10 }}>
        {isSupervisor && (
          <MenuLink icon="eye" label="مراجعة الوصفات" onClick={() => navigate('/review')} />
        )}
        <MenuLink icon="bulb" label="إرسال اقتراح" onClick={() => navigate('/suggestions')} />
        {isAdmin && (
          <MenuLink icon="settings" label="لوحة الأدمن" onClick={() => navigate('/admin')} />
        )}
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
    </div>
  )
}

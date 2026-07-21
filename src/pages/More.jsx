import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RoleBadge } from '../components/ui'

function MenuLink({ icon, label, onClick, note }) {
  return (
    <button className="card" onClick={onClick}
      style={{ padding: '16px 18px', width: '100%', textAlign: 'inherit', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--color-surface)' }}>
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      <span className="grow" style={{ fontWeight: 700 }}>{label}</span>
      {note != null && <span className="badge badge-pending">{note}</span>}
      <span className="text-soft">←</span>
    </button>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="card row-between" style={{ padding: '14px 18px', cursor: 'pointer' }}>
      <span style={{ fontWeight: 700 }}>{label}</span>
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
        <h1>☰ المزيد</h1>
      </div>

      <div className="card" style={{ padding: '18px', marginBottom: 20 }}>
        <div className="row" style={{ gap: 14 }}>
          <div style={{ fontSize: '2.6rem' }}>🧑‍🍳</div>
          <div className="grow">
            <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{profile?.display_name || 'مستخدم'}</div>
            <div className="text-soft" dir="ltr" style={{ textAlign: 'right', fontSize: '0.85rem' }}>{profile?.login_id}</div>
          </div>
          <RoleBadge role={profile?.role} />
        </div>
      </div>

      <div className="stack" style={{ gap: 10 }}>
        {isSupervisor && (
          <MenuLink icon="🕵️" label="مراجعة الوصفات" onClick={() => navigate('/review')} />
        )}
        <MenuLink icon="💡" label="إرسال اقتراح" onClick={() => navigate('/suggestions')} />
        {isAdmin && (
          <MenuLink icon="⚙️" label="لوحة الأدمن" onClick={() => navigate('/admin')} />
        )}
      </div>

      <h3 className="mt-lg mb">العرض</h3>
      <div className="stack" style={{ gap: 10 }}>
        <Toggle label="🔠 تكبير حجم الخط" checked={fontLarge} onChange={toggleFont} />
        <Toggle label="🌙 الوضع الليلي" checked={darkMode} onChange={toggleDark} />
      </div>

      <button className="btn btn-ghost mt-lg" onClick={handleLogout} style={{ color: 'var(--color-danger)' }}>
        🚪 تسجيل الخروج
      </button>

      <p className="text-center text-soft mt-lg" style={{ fontSize: '0.8rem' }}>
        وصفات أبناء عمرو السروجي · أرشيف العائلة
      </p>
    </div>
  )
}

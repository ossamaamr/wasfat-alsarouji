import { useEffect, useState, useCallback, useRef } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOnline } from '../hooks/useOnline'
import { supabase } from '../lib/supabase'
import Icon from './Icon'

// ترتيب التبويبات الرئيسية للتنقّل بالسحب
const TABS = ['/', '/my', '/add', '/notifications', '/more']

function NavItem({ to, icon, label, count }) {
  return (
    <NavLink to={to} end={to === '/'}>
      <span className="nav-icon">
        <Icon name={icon} size={24} />
      </span>
      <span>{label}</span>
      {count > 0 && <span className="nav-dot">{count > 99 ? '99+' : count}</span>}
    </NavLink>
  )
}

export default function Layout() {
  const { isSupervisor, session } = useAuth()
  const online = useOnline()
  const location = useLocation()
  const navigate = useNavigate()
  const [unread, setUnread] = useState(0)
  const [pending, setPending] = useState(0)
  const touch = useRef(null)

  // إعادة التمرير لأعلى عند كل تنقّل
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  // ── التنقّل بالسحب أفقيًا بين التبويبات ──
  function onTouchStart(e) {
    const t = e.changedTouches[0]
    // نتجاهل السحب إن بدأ فوق شريط تصنيفات أو نافذة أو حقل إدخال
    const skip = e.target.closest?.('.chips-scroll, .modal, input, textarea, [data-noswipe]')
    touch.current = skip ? null : { x: t.clientX, y: t.clientY, time: Date.now() }
  }
  function onTouchEnd(e) {
    const s = touch.current
    touch.current = null
    if (!s) return
    const t = e.changedTouches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    // سحب أفقي واضح وسريع فقط
    if (Date.now() - s.time > 700) return
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.7) return
    const idx = TABS.indexOf(location.pathname)
    if (idx < 0) return
    // في الواجهة العربية: السحب لليسار ⇐ التبويب التالي، لليمين ⇐ السابق
    const nextIdx = dx < 0 ? idx + 1 : idx - 1
    if (nextIdx < 0 || nextIdx >= TABS.length) return
    navigate(TABS[nextIdx])
  }

  const loadBadges = useCallback(async () => {
    if (!session?.user || !online) return
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false)
    setUnread(unreadCount || 0)

    if (isSupervisor) {
      const { count: pendingCount } = await supabase
        .from('recipes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
      setPending(pendingCount || 0)
    }
  }, [session, online, isSupervisor])

  useEffect(() => {
    loadBadges()
  }, [loadBadges, location.pathname])

  useEffect(() => {
    const id = setInterval(loadBadges, 60000)
    return () => clearInterval(id)
  }, [loadBadges])

  return (
    <>
      {!online && (
        <div className="offline-bar">وضع دون اتصال — تصفّح الوصفات المحفوظة فقط</div>
      )}

      <div
        style={{ paddingTop: online ? 0 : 28 }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <Outlet context={{ reloadBadges: loadBadges }} />
        <footer className="app-credit">
          من تطوير وإدارة: <span className="credit-name">أسامة بن عمرو السَّروجي</span>
        </footer>
      </div>

      <nav className="bottom-nav">
        <NavItem to="/" icon="home" label="الرئيسية" />
        <NavItem to="/my" icon="book" label="وصفاتي" />
        <NavItem to="/add" icon="plus" label="إضافة" />
        <NavItem to="/notifications" icon="bell" label="الإشعارات" count={unread} />
        <NavItem to="/more" icon="menu" label="المزيد" count={isSupervisor ? pending : 0} />
      </nav>
    </>
  )
}

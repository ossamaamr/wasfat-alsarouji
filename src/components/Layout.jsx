import { useEffect, useState, useCallback } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOnline } from '../hooks/useOnline'
import { supabase } from '../lib/supabase'
import Icon from './Icon'

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
  const [unread, setUnread] = useState(0)
  const [pending, setPending] = useState(0)

  // إعادة التمرير لأعلى عند كل تنقّل — تنقّل أنعم
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' })
  }, [location.pathname])

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

      <div style={{ paddingTop: online ? 0 : 28 }}>
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

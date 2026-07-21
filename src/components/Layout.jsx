import { useEffect, useState, useCallback } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOnline } from '../hooks/useOnline'
import { supabase } from '../lib/supabase'

function NavItem({ to, icon, label, count }) {
  return (
    <NavLink to={to} end={to === '/'}>
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
      {count > 0 && <span className="nav-dot">{count > 99 ? '٩٩+' : count}</span>}
    </NavLink>
  )
}

export default function Layout() {
  const { profile, isSupervisor, session } = useAuth()
  const online = useOnline()
  const location = useLocation()
  const [unread, setUnread] = useState(0)
  const [pending, setPending] = useState(0)

  const loadBadges = useCallback(async () => {
    if (!session?.user || !online) return
    // الإشعارات غير المقروءة
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false)
    setUnread(unreadCount || 0)

    // الوصفات قيد المراجعة (للمشرف/الأدمن فقط)
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
      {!online && <div className="offline-bar">📴 وضع دون اتصال — تصفّح الوصفات المحفوظة فقط</div>}

      <div style={{ paddingTop: online ? 0 : 28 }}>
        <Outlet context={{ reloadBadges: loadBadges }} />
      </div>

      <nav className="bottom-nav">
        <NavItem to="/" icon="🏠" label="الرئيسية" />
        <NavItem to="/my" icon="📖" label="وصفاتي" />
        <NavItem to="/add" icon="➕" label="إضافة" />
        <NavItem to="/notifications" icon="🔔" label="الإشعارات" count={unread} />
        <NavItem to="/more" icon="☰" label="المزيد" count={isSupervisor ? pending : 0} />
      </nav>
    </>
  )
}

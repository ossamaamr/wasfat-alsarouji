import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, loginIdToEmail } from '../lib/supabase'
import { registerPush } from '../lib/push'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null) // صف المستخدم من جدول users
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return null
    }
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) {
      console.error('تعذّر تحميل ملف المستخدم:', error.message)
      setProfile(null)
      return null
    }
    // المستخدم المعطّل يُخرَج فورًا
    if (data.status === 'disabled') {
      await supabase.auth.signOut()
      setProfile(null)
      setSession(null)
      return null
    }
    setProfile(data)
    // تسجيل الجهاز للإشعارات الخارجية (أندرويد) — مُعطّل حتى تُضبط Firebase
    // لتفعيله: أضِف google-services.json واضبط VITE_ENABLE_PUSH=true
    if (data.status === 'active' && import.meta.env.VITE_ENABLE_PUSH === 'true') {
      registerPush(data.id)
    }
    return data
  }, [])

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session?.user) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  // تسجيل الدخول بالمعرّف وكلمة المرور
  const signIn = useCallback(async (loginId, password) => {
    const email = loginIdToEmail(loginId)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await loadProfile(data.user.id)
    return data
  }, [loadProfile])

  // الإعداد أول مرة: تعيين كلمة مرور جديدة واسم العرض وتفعيل الحساب
  const completeFirstSetup = useCallback(async (newPassword, displayName) => {
    const { error: pwError } = await supabase.auth.updateUser({ password: newPassword })
    if (pwError) throw pwError

    const { data, error } = await supabase
      .from('users')
      .update({ display_name: displayName.trim(), status: 'active' })
      .eq('id', session.user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }, [session])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (session?.user) return loadProfile(session.user.id)
    return null
  }, [session, loadProfile])

  const needsSetup = Boolean(
    profile && (profile.status === 'pending' || !profile.display_name)
  )

  const value = {
    session,
    profile,
    loading,
    signIn,
    signOut,
    completeFirstSetup,
    refreshProfile,
    needsSetup,
    isAuthenticated: Boolean(session?.user),
    role: profile?.role || null,
    isAdmin: profile?.role === 'admin',
    isSupervisor: profile?.role === 'supervisor' || profile?.role === 'admin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth يجب أن يُستخدم داخل AuthProvider')
  return ctx
}

import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/ui'
import Logo from '../components/Logo'

export default function Login() {
  const { signIn, isAuthenticated, needsSetup } = useAuth()
  const navigate = useNavigate()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={needsSetup ? '/setup' : '/'} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!loginId.trim() || !password) {
      setError('الرجاء إدخال المعرّف وكلمة المرور.')
      return
    }
    setBusy(true)
    try {
      await signIn(loginId, password)
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err?.message || ''
      if (msg.includes('Invalid login credentials')) {
        setError('المعرّف أو كلمة المرور غير صحيحة.')
      } else if (msg.includes('Email not confirmed')) {
        setError('الحساب غير مفعّل بعد. تواصل مع مسؤول العائلة.')
      } else {
        setError('تعذّر تسجيل الدخول. تأكّد من اتصالك بالإنترنت وحاول مجددًا.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="center-screen" style={{ justifyContent: 'flex-start', paddingTop: '10vh' }}>
      <Logo size={104} />
      <div className="text-center">
        <h1 style={{ marginBottom: 4 }}>وصفات أسرة السَّروجيُّ</h1>
        <p className="text-soft">أرشيف العائلة — الدخول بالمعرّف الخاص بك</p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 380, marginTop: 8 }}>
        {error && <Alert type="error">{error}</Alert>}

        <div className="field">
          <label htmlFor="loginId">المعرّف</label>
          <input
            id="loginId"
            className="input"
            type="text"
            inputMode="text"
            autoComplete="username"
            dir="ltr"
            style={{ textAlign: 'center' }}
            placeholder="المعرّف الذي أعطاك إياه المسؤول"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">كلمة المرور</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'جارٍ الدخول…' : 'دخول'}
        </button>
      </form>

      <p className="text-soft text-center" style={{ maxWidth: 340, fontSize: '0.85rem' }}>
        أول مرة تدخل؟ استخدم المعرّف وكلمة المرور المؤقتة، وسنطلب منك بعدها تعيين كلمة مرور
        واسمك.
      </p>

      <p className="text-soft text-center" style={{ marginTop: 'auto', paddingTop: 24, fontSize: '0.76rem', fontWeight: 600 }}>
        من تطوير وإدارة: <span style={{ color: 'var(--color-primary)' }}>أسامة بن عمرو السَّروجي</span>
      </p>
    </div>
  )
}

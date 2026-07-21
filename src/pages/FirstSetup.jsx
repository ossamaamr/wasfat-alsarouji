import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/ui'

export default function FirstSetup() {
  const { isAuthenticated, needsSetup, completeFirstSetup, profile } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!needsSetup) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!displayName.trim()) return setError('الرجاء كتابة اسمك كما يظهر للعائلة.')
    if (password.length < 6) return setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.')
    if (password !== confirm) return setError('كلمتا المرور غير متطابقتين.')

    setBusy(true)
    try {
      await completeFirstSetup(password, displayName)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'تعذّر إكمال الإعداد. حاول مجددًا.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="center-screen" style={{ justifyContent: 'flex-start', paddingTop: '8vh' }}>
      <div style={{ fontSize: '3rem' }}>👋</div>
      <div className="text-center">
        <h1 style={{ marginBottom: 4 }}>أهلًا بك في العائلة</h1>
        <p className="text-soft">
          خطوتان بسيطتان لإكمال حسابك (معرّفك: <b dir="ltr">{profile?.login_id}</b>)
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 400, marginTop: 8 }}>
        {error && <Alert type="error">{error}</Alert>}

        <div className="field">
          <label htmlFor="name">
            اسمك كما يظهر للعائلة
            <span className="hint"> — مثال: أم خالد، عبدالله</span>
          </label>
          <input
            id="name"
            className="input"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="اكتب اسمك هنا"
          />
        </div>

        <div className="field">
          <label htmlFor="pw">كلمة مرور جديدة</label>
          <input
            id="pw"
            className="input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6 أحرف على الأقل"
          />
        </div>

        <div className="field">
          <label htmlFor="pw2">تأكيد كلمة المرور</label>
          <input
            id="pw2"
            className="input"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="أعد كتابة كلمة المرور"
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'جارٍ الحفظ…' : 'ابدأ الاستخدام'}
        </button>
      </form>
    </div>
  )
}

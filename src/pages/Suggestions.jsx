import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSuggestion } from '../lib/api'
import { Alert } from '../components/ui'
import Icon from '../components/Icon'

export default function Suggestions() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (message.trim().length < 3) return setError('اكتب اقتراحك أولًا.')
    setBusy(true)
    try {
      await createSuggestion(message)
      setDone(true)
      setMessage('')
    } catch (err) {
      setError(err?.message || 'تعذّر إرسال الاقتراح. حاول مجددًا.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn-soft btn-sm" style={{ width: 'auto' }} onClick={() => navigate('/more')}>
          <Icon name="back" size={18} /> رجوع
        </button>
        <h1 className="row" style={{ gap: 8 }}><Icon name="bulb" size={24} /> الاقتراحات</h1>
      </div>

      {done ? (
        <div className="stack">
          <Alert type="success">وصل اقتراحك إلى مسؤول العائلة. شكرًا لك!</Alert>
          <button className="btn btn-ghost" onClick={() => setDone(false)}>إرسال اقتراح آخر</button>
          <button className="btn btn-soft" onClick={() => navigate('/')}>العودة للرئيسية</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="text-soft">
            لديك فكرة لتحسين التطبيق، أو طلب تعديل على وصفة؟ اكتبها هنا وستصل مباشرة إلى مسؤول
            العائلة.
          </p>
          {error && <Alert type="error">{error}</Alert>}
          <div className="field">
            <label htmlFor="msg">اقتراحك</label>
            <textarea
              id="msg"
              className="textarea"
              style={{ minHeight: 160 }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب اقتراحك أو ملاحظتك…"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'جارٍ الإرسال…' : <><Icon name="send" /> إرسال الاقتراح</>}
          </button>
        </form>
      )}
    </div>
  )
}

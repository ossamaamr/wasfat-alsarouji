import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.value = 0.15
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = 880
      osc.connect(gain)
      osc.start(ctx.currentTime + i * 0.5)
      osc.stop(ctx.currentTime + i * 0.5 + 0.25)
    }
  } catch { /* تجاهل */ }
  try { navigator.vibrate?.([300, 150, 300, 150, 300]) } catch { /* تجاهل */ }
}

function fmt(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export default function Countdown({ minutes, label, onClose }) {
  const [left, setLeft] = useState(minutes * 60)
  const [running, setRunning] = useState(true)
  const [done, setDone] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!running) return
    ref.current = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(ref.current)
          setRunning(false)
          setDone(true)
          beep()
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => clearInterval(ref.current)
  }, [running])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <div className="row-between mb">
          <h2 style={{ margin: 0 }}>⏱️ مؤقّت</h2>
          <button className="btn btn-soft btn-sm" style={{ width: 'auto' }} onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>
        {label && <p className="text-soft" style={{ marginTop: 0 }}>{label}</p>}
        <div
          style={{
            fontSize: '3.4rem',
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            color: done ? 'var(--color-danger)' : 'var(--color-primary)',
            margin: '10px 0',
          }}
        >
          {fmt(left)}
        </div>
        {done ? (
          <div className="stack">
            <div className="alert alert-success" style={{ justifyContent: 'center' }}>انتهى الوقت!</div>
            <button className="btn btn-primary" onClick={onClose}>تمّ</button>
          </div>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn btn-primary" onClick={() => setRunning((r) => !r)}>
                <Icon name={running ? 'pause' : 'play'} /> {running ? 'إيقاف مؤقّت' : 'متابعة'}
              </button>
              <button className="btn btn-soft" onClick={() => setLeft((v) => v + 60)}>+ دقيقة</button>
            </div>
            <button className="btn btn-ghost" onClick={() => { setLeft(minutes * 60); setRunning(true); setDone(false) }}>
              <Icon name="refresh" /> إعادة
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

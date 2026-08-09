import { useState } from 'react'
import type { AuthUser } from '../../types'

interface Props { onLogin: (token: string, user: AuthUser) => void }

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) { setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'เข้าสู่ระบบไม่สำเร็จ'); setLoading(false); return }
      onLogin(data.token, data.user)
    } catch {
      setError('ไม่สามารถเชื่อมต่อ Backend ได้')
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--canvas)' }}>
      <form onSubmit={submit} className="card" style={{ width: 340 }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--blue)' }}>ALS Rehab</h2>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>เข้าสู่ระบบเพื่อใช้งาน</p>
        </div>
        <div className="field">
          <label className="field-label">ชื่อผู้ใช้</label>
          <input className="inp" value={username} onChange={e => setUsername(e.target.value)} placeholder="username" autoFocus />
        </div>
        <div className="field" style={{ marginTop: 10 }}>
          <label className="field-label">รหัสผ่าน</label>
          <input className="inp" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
        </div>
        {error && <div style={{ color: 'var(--rose)', fontSize: 12, marginTop: 10 }}>{error}</div>}
        <button className="btn" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 16 }} disabled={loading}>
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  )
}

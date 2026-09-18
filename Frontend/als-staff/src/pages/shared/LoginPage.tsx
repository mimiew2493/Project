import { useState } from 'react'
import type { AuthUser } from '../../types'
import { API_BASE } from '../../config'
import { IdCardIcon, LockIcon, EyeIcon, EyeOffIcon, LogInIcon } from '../../components/Icon'

interface Props { onLogin: (token: string, user: AuthUser) => void }

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) { setError('กรุณากรอกรหัสและรหัสผ่าน'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
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
    <div className="login-shell">
      <div className="login-brand">
        <div className="login-brand-inner">
          <h1 className="login-heading">
            <span className="line-white">ระบบสนับสนุนการฟื้นฟู</span>
            <span className="line-blue">ผู้ป่วยระบบประสาทและกล้ามเนื้อ</span>
          </h1>
          <p className="login-brand-sub">
            สนับสนุนผู้เชี่ยวชาญด้านการฟื้นฟูระบบประสาทด้วยข้อมูลอุปกรณ์แบบเรียลไทม์และการวินิจฉัยผู้ป่วยอย่างมีประสิทธิภาพ
          </p>
        </div>
      </div>

      <div className="login-panel">
        <form className="login-form" onSubmit={submit}>
          <div className="login-head">
            <h1>เข้าสู่ระบบ</h1>
            <p>โปรดระบุข้อมูลเพื่อเริ่มต้นการใช้งาน</p>
          </div>

          <div className="field">
            <label className="field-label">รหัสนักกายภาพบำบัด</label>
            <div className="input-icon-wrap">
              <span className="input-icon-left"><IdCardIcon size={16} /></span>
              <input
                className="inp"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="เช่น PT-99999"
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          <div className="field">
            <div className="login-row-split">
              <label className="field-label">รหัสผ่าน</label>
              <button type="button" className="login-forgot">ลืมรหัสผ่าน?</button>
            </div>
            <div className="input-icon-wrap has-right">
              <span className="input-icon-left"><LockIcon size={16} /></span>
              <input
                className="inp"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="........"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(s => !s)}
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
          </div>

          {error && <div style={{ color: 'var(--rose)', fontSize: 12, marginTop: 4 }}>{error}</div>}

          <button className="btn btn-login" type="submit" disabled={loading}>
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            <LogInIcon size={16} />
          </button>

          <div className="login-footer">ภาษาไทย &nbsp;|&nbsp; ติดต่อช่วยเหลือ</div>
        </form>
      </div>
    </div>
  )
}

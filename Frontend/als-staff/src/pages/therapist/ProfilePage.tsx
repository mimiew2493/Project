import { useEffect, useState } from 'react'
import type { AuthUser, Therapist } from '../../types'

interface Props { user: AuthUser; onLogout: () => void }

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="field"><label className="field-label">{label}</label>{children}</div>
)

export default function ProfilePage({ user, onLogout }: Props) {
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://localhost:3000/api/therapists')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setTherapist(d.find((t: Therapist) => t.ot_id === user.ot_id) ?? null) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user.ot_id])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 4) { alert('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'); return }
    if (newPassword !== confirmPassword) { alert('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน'); return }
    setSaving(true)
    const res = await fetch('http://localhost:3000/api/therapists', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otId: user.ot_id, usersId: user.users_id, newPassword }),
    }).catch(() => null)
    if (res?.ok) { showToast('เปลี่ยนรหัสผ่านสำเร็จ'); setNewPassword(''); setConfirmPassword('') }
    else alert('เปลี่ยนรหัสผ่านไม่สำเร็จ')
    setSaving(false)
  }

  if (loading) return <div className="loading-box">กำลังโหลด...</div>

  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`

  return (
    <>
      {toast && <div className="toast toast-success">{toast}</div>}
      <div className="h-sec">
        <div><h1 className="page-title">โปรไฟล์ของฉัน</h1><p className="page-sub">ข้อมูลบัญชีและการตั้งค่าส่วนตัว</p></div>
      </div>

      <div className="reg-grid">
        <div className="stack">
          <div className="card" style={{ textAlign: 'center', padding: 28 }}>
            <div className="av" style={{ width: 64, height: 64, fontSize: 22, margin: '0 auto 12px', background: 'var(--blue)' }}>{initials}</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{user.first_name} {user.last_name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{user.role_name} · {therapist?.ot_id ?? '—'}</div>
          </div>

          <div className="card">
            <div className="h-sec"><span className="h-sec-title">ข้อมูลบัญชี</span></div>
            <div className="kv"><span>ชื่อผู้ใช้</span><b className="mono">{user.username}</b></div>
            <div className="kv"><span>เลขใบอนุญาต</span><b className="mono">{therapist?.license_number ?? '—'}</b></div>
            <div className="kv"><span>เบอร์ติดต่อ</span><b className="mono">{therapist?.phone ?? '—'}</b></div>
            <div className="kv"><span>จำนวนเคสที่ดูแล</span><b>{therapist?.cases ?? 0} เคส</b></div>
          </div>

          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={onLogout}>ออกจากระบบ</button>
        </div>

        <div className="stack">
          <div className="card">
            <div className="h-sec"><span className="h-sec-title">เปลี่ยนรหัสผ่าน</span></div>
            <Field label="รหัสผ่านใหม่">
              <input className="inp" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="อย่างน้อย 4 ตัวอักษร" />
            </Field>
            <Field label="ยืนยันรหัสผ่านใหม่">
              <input className="inp" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="พิมพ์ซ้ำอีกครั้ง" />
            </Field>
            <div className="form-actions">
              <button className="btn btn-sm" onClick={changePassword} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

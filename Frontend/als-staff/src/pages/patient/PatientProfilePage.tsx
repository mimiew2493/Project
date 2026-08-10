import { useEffect, useState } from 'react'
import type { AuthUser, Patient } from '../../types'
import { API_BASE } from '../../config'

interface Props { user: AuthUser; onLogout: () => void }

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="field"><label className="field-label">{label}</label>{children}</div>
)

export default function PatientProfilePage({ user, onLogout }: Props) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/patients?status=ALL`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPatient(d.find((p: Patient) => p.patient_id === user.patient_id) ?? null) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user.patient_id])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 4) { alert('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'); return }
    if (newPassword !== confirmPassword) { alert('รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน'); return }
    setSaving(true)
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: user.patient_id, usersId: user.users_id, newPassword }),
    }).catch(() => null)
    if (res?.ok) { showToast('เปลี่ยนรหัสผ่านสำเร็จ'); setNewPassword(''); setConfirmPassword('') }
    else alert('เปลี่ยนรหัสผ่านไม่สำเร็จ')
    setSaving(false)
  }

  if (loading) return <div className="loading-box">กำลังโหลด...</div>

  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`

  return (
    <div className="stack">
      {toast && <div className="toast toast-success">{toast}</div>}

      <div className="card" style={{ textAlign: 'center', padding: 24 }}>
        <div className="av" style={{ width: 58, height: 58, fontSize: 20, margin: '0 auto 10px', background: 'var(--blue)' }}>{initials}</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{user.first_name} {user.last_name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>{patient?.patient_id ?? '—'}</div>
      </div>

      <div className="card">
        <div className="h-sec"><span className="h-sec-title">ข้อมูลการรักษา</span></div>
        <div className="kv"><span>เบอร์ติดต่อ</span><b className="mono">{patient?.phone ?? '—'}</b></div>
        <div className="kv"><span>ที่อยู่</span><b>{patient?.address ?? '—'}</b></div>
        <div className="kv"><span>วันที่ลงทะเบียน</span><b>{patient?.register_date ?? '—'}</b></div>
      </div>

      <div className="card">
        <div className="h-sec"><span className="h-sec-title">เปลี่ยนรหัสผ่าน</span></div>
        <Field label="รหัสผ่านใหม่">
          <input className="inp" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="อย่างน้อย 4 ตัวอักษร" />
        </Field>
        <Field label="ยืนยันรหัสผ่านใหม่">
          <input className="inp" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="พิมพ์ซ้ำอีกครั้ง" />
        </Field>
        <button className="btn" style={{ width: '100%', justifyContent: 'center' }} onClick={changePassword} disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
        </button>
      </div>

      <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={onLogout}>ออกจากระบบ</button>
    </div>
  )
}

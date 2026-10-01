import { useEffect, useState } from 'react'
import type { AuthUser, Patient } from '../../types'
import { API_BASE } from '../../config'

interface Props { user: AuthUser; onLogout: () => void }

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-2.5 flex flex-col gap-1.5">
    <label className="text-[10.5px] font-bold text-[#62677D]">{label}</label>
    {children}
  </div>
)

const inputCls = 'rounded-[10px] border border-[#E4E1F0] bg-white/75 px-3 py-2.5 text-[12.5px] text-[#1B1E2C] outline-none focus:border-[#E5533A] focus:ring-[3px] focus:ring-[#FDEAE6]'

const Kv = ({ k, v, mono }: { k: string; v: string; mono?: boolean }) => (
  <div className="flex justify-between gap-3 border-b border-[#1B1E2C]/[.06] py-2 text-[11.5px] last:border-b-0">
    <span className="text-[#82869C]">{k}</span>
    <b className={`text-right font-semibold text-[#1B1E2C] ${mono ? 'font-mono' : ''}`}>{v}</b>
  </div>
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

  if (loading) return <div className="py-16 text-center text-[12px] text-[#82869C]">กำลังโหลด...</div>

  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`

  return (
    <div className="space-y-3.5">
      {toast && <div className="toast toast-success">{toast}</div>}

      <div className="pg-card px-4 py-6 text-center">
        <div className="mx-auto mb-2.5 flex h-14 w-14 items-center justify-center rounded-full bg-[#FDEAE6] text-[16px] font-bold text-[#E5533A]">{initials}</div>
        <div className="text-[15px] font-bold text-[#1B1E2C]">{user.first_name} {user.last_name}</div>
        <div className="mt-0.5 text-[11px] text-[#82869C]">รหัสผู้ป่วย: {patient?.patient_id ?? '—'}</div>
      </div>

      <div className="pg-card p-4">
        <div className="mb-1 text-[11px] font-bold text-[#62677D]">ข้อมูลการรักษา</div>
        <Kv k="เบอร์ติดต่อ" v={patient?.phone ?? '—'} mono />
        <Kv k="ที่อยู่" v={patient?.address ?? '—'} />
        <Kv k="วันที่ลงทะเบียน" v={patient?.register_date ?? '—'} />
      </div>

      <div className="pg-card p-4">
        <div className="mb-2.5 text-[11px] font-bold text-[#62677D]">เปลี่ยนรหัสผ่าน</div>
        <Field label="รหัสผ่านใหม่">
          <input className={inputCls} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="อย่างน้อย 4 ตัวอักษร" />
        </Field>
        <Field label="ยืนยันรหัสผ่านใหม่">
          <input className={inputCls} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="พิมพ์ซ้ำอีกครั้ง" />
        </Field>
        <button
          onClick={changePassword}
          disabled={saving}
          className="mt-1.5 w-full rounded-[13px] bg-[#E5533A] py-3 text-[13px] font-extrabold text-white shadow-[0_10px_22px_rgba(229,83,58,.24)] transition active:scale-[.97] disabled:opacity-60"
        >
          {saving ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
        </button>
      </div>

      <button onClick={onLogout} className="w-full rounded-[13px] bg-[#1B1E2C]/5 py-3 text-[13px] font-extrabold text-[#C43D5C]">ออกจากระบบ</button>
    </div>
  )
}

import { useEffect, useState } from 'react'
import type { Staff } from '../../types'
import SearchBar from '../../components/SearchBar'
import { XIcon } from '../../components/Icon'
import { API_BASE } from '../../config'

interface FormData { firstName: string; lastName: string; phone: string; email: string; gender: string }
const emptyForm: FormData = { firstName:'', lastName:'', phone:'', email:'', gender:'' }
const Field = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
  <div className="field"><label className="field-label">{label} {req && <span className="req">*</span>}</label>{children}</div>
)

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const load = () => {
    fetch(`${API_BASE}/api/staff`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setStaff(d); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(load, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const ch = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const openAddForm = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }
  const startEdit = (s: Staff) => {
    setEditing(s)
    setForm({ firstName: s.first_name, lastName: s.last_name, phone: s.phone ?? '', email: s.email ?? '', gender: '' })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm) }

  const save = async () => {
    if (!form.firstName || !form.lastName) { alert('กรุณากรอกชื่อและนามสกุล'); return }
    setSaving(true)
    const res = editing
      ? await fetch(`${API_BASE}/api/staff`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usersId: editing.users_id, ...form }),
        }).catch(() => null)
      : await fetch(`${API_BASE}/api/staff`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
        }).catch(() => null)
    if (res?.ok) { showToast(editing ? 'แก้ไขข้อมูลสำเร็จ!' : 'เพิ่มเจ้าหน้าที่สำเร็จ!'); closeForm(); load() }
    else { const data = await res?.json().catch(() => null); alert(data?.error ?? 'เกิดข้อผิดพลาด') }
    setSaving(false)
  }

  const removeStaff = async (s: Staff) => {
    if (!confirm(`ยืนยันลบเจ้าหน้าที่ ${s.first_name} ${s.last_name} (${s.staff_id})? การลบไม่สามารถย้อนกลับได้`)) return
    const res = await fetch(`${API_BASE}/api/staff?staff_id=${s.staff_id}`, { method: 'DELETE' }).catch(() => null)
    if (res?.ok) { showToast('ลบเจ้าหน้าที่สำเร็จ'); load() }
    else alert('ลบไม่สำเร็จ')
  }

  const resetPassword = async (s: Staff) => {
    const newPassword = prompt(`ตั้งรหัสผ่านใหม่สำหรับ ${s.first_name} ${s.last_name}`)
    if (!newPassword) return
    if (newPassword.length < 4) { alert('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'); return }
    const res = await fetch(`${API_BASE}/api/staff`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usersId: s.users_id, newPassword }),
    }).catch(() => null)
    if (res?.ok) showToast('รีเซ็ตรหัสผ่านสำเร็จ')
    else alert('รีเซ็ตรหัสผ่านไม่สำเร็จ')
  }

  const filtered = staff.filter(s =>
    (s.first_name + s.last_name + s.staff_id).toLowerCase().includes(search.toLowerCase()))
  const total = staff.length

  if (loading) return <div className="loading-box">กำลังโหลด...</div>

  return (
    <>
      {toast && <div className="toast toast-success">{toast}</div>}
      <div className="h-sec">
        <div><h1 className="page-title">จัดการเจ้าหน้าที่เวชระเบียน</h1><p className="page-sub">เพิ่ม แก้ไข และดูรายชื่อเจ้าหน้าที่เวชระเบียนทั้งหมดในศูนย์</p></div>
        <button className="btn btn-sm" onClick={() => (showForm ? closeForm() : openAddForm())}>
          {showForm ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><XIcon size={13} /> ปิดฟอร์ม</span> : '+ เพิ่มเจ้าหน้าที่'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ borderColor: 'var(--blue)' }}>
          <div className="h-sec"><span className="h-sec-title">{editing ? `แก้ไขข้อมูล · ${editing.staff_id}` : 'เพิ่มเจ้าหน้าที่เวชระเบียนใหม่'}</span></div>
          <div className="grid2">
            <Field label="ชื่อ" req><input className="inp" name="firstName" value={form.firstName} onChange={ch} placeholder="ระบุชื่อ" /></Field>
            <Field label="นามสกุล" req><input className="inp" name="lastName" value={form.lastName} onChange={ch} placeholder="ระบุนามสกุล" /></Field>
            <Field label="เบอร์ติดต่อ"><input className="inp mono" name="phone" value={form.phone} onChange={ch} placeholder="08X-XXX-XXXX" /></Field>
            <Field label="อีเมล"><input className="inp" name="email" value={form.email} onChange={ch} placeholder="example@mail.com" /></Field>
            <Field label="เพศ"><select className="inp" name="gender" value={form.gender} onChange={ch}><option value="">เลือก...</option><option value="ชาย">ชาย</option><option value="หญิง">หญิง</option></select></Field>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost btn-sm" onClick={closeForm}>ยกเลิก</button>
            <button className="btn btn-sm" onClick={save} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </div>
      )}

      <div className="card"><div className="eyebrow">ทั้งหมด</div><div className="big">{total}<span className="big-unit">คน</span></div></div>

      <div className="toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="ค้นหาด้วยชื่อ..." />
      </div>

      <div className="card-0">
        <table className="data-table">
          <thead><tr><th>รหัส</th><th>ชื่อ-นามสกุล</th><th>เบอร์โทร</th><th>อีเมล</th><th></th></tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>ไม่พบข้อมูล</td></tr>
              : filtered.map(s => (
                  <tr key={s.staff_id}>
                    <td className="mono">{s.staff_id}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="av" style={{ background: 'var(--blue)', width: 28, height: 28, fontSize: 10 }}>{(s.first_name[0] ?? '') + (s.last_name[0] ?? '')}</div><b>{s.first_name} {s.last_name}</b></div></td>
                    <td className="mono">{s.phone ?? '—'}</td>
                    <td className="mono">{s.email ?? '—'}</td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(s)}>แก้ไข</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => resetPassword(s)}>รีเซ็ตรหัสผ่าน</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeStaff(s)}>ลบ</button>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </>
  )
}

import { useEffect, useState } from 'react'
import type { Therapist } from '../../types'
import SearchBar from '../../components/SearchBar'

interface FormData { firstName: string; lastName: string; licenseNumber: string; phone: string; email: string; gender: string }
const emptyForm: FormData = { firstName:'', lastName:'', licenseNumber:'', phone:'', email:'', gender:'' }
const Field = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
  <div className="field"><label className="field-label">{label} {req && <span className="req">*</span>}</label>{children}</div>
)

export default function TherapistsPage() {
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Therapist | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const load = () => {
    fetch('http://localhost:3000/api/therapists')
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setTherapists(d); setLoading(false) }).catch(() => setLoading(false))
  }
  useEffect(load, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const ch = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const openAddForm = () => { setEditing(null); setForm(emptyForm); setShowForm(true) }
  const startEdit = (t: Therapist) => {
    setEditing(t)
    setForm({ firstName: t.first_name, lastName: t.last_name, licenseNumber: t.license_number, phone: t.phone ?? '', email: '', gender: '' })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm) }

  const save = async () => {
    if (!form.firstName || !form.lastName || !form.licenseNumber || !form.phone) { alert('กรุณากรอกข้อมูลที่จำเป็นให้ครบ'); return }
    setSaving(true)
    const res = editing
      ? await fetch('http://localhost:3000/api/therapists', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otId: editing.ot_id, usersId: editing.users_id, ...form }),
        }).catch(() => null)
      : await fetch('http://localhost:3000/api/therapists', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
        }).catch(() => null)
    if (res?.ok) { showToast(editing ? 'แก้ไขข้อมูลสำเร็จ!' : 'เพิ่มนักกายภาพสำเร็จ!'); closeForm(); load() }
    else alert('เกิดข้อผิดพลาด')
    setSaving(false)
  }

  const removeTherapist = async (t: Therapist) => {
    if (!confirm(`ยืนยันลบ กภ. ${t.first_name} ${t.last_name} (${t.ot_id})? การลบไม่สามารถย้อนกลับได้`)) return
    const res = await fetch(`http://localhost:3000/api/therapists?ot_id=${t.ot_id}`, { method: 'DELETE' }).catch(() => null)
    if (res?.ok) { showToast('ลบนักกายภาพสำเร็จ'); load() }
    else alert('ลบไม่สำเร็จ')
  }

  const resetPassword = async (t: Therapist) => {
    const newPassword = prompt(`ตั้งรหัสผ่านใหม่สำหรับ กภ. ${t.first_name} ${t.last_name}`)
    if (!newPassword) return
    if (newPassword.length < 4) { alert('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'); return }
    const res = await fetch('http://localhost:3000/api/therapists', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otId: t.ot_id, usersId: t.users_id, newPassword }),
    }).catch(() => null)
    if (res?.ok) showToast('รีเซ็ตรหัสผ่านสำเร็จ')
    else alert('รีเซ็ตรหัสผ่านไม่สำเร็จ')
  }

  const filtered = therapists.filter(t =>
    (t.first_name + t.last_name + t.license_number + t.ot_id).toLowerCase().includes(search.toLowerCase()))
  const total = therapists.length
  const caseTotal = therapists.reduce((s, t) => s + (t.cases ?? 0), 0)

  if (loading) return <div className="loading-box">กำลังโหลด...</div>

  return (
    <>
      {toast && <div className="toast toast-success">{toast}</div>}
      <div className="h-sec">
        <div><h1 className="page-title">จัดการนักกิจกรรมบำบัด</h1><p className="page-sub">เพิ่ม แก้ไข และดูภาระงานของนักกิจกรรมบำบัดทั้งหมดในศูนย์</p></div>
        <button className="btn btn-sm" onClick={() => (showForm ? closeForm() : openAddForm())}>{showForm ? '✕ ปิดฟอร์ม' : '+ เพิ่มนักกายภาพ'}</button>
      </div>

      {showForm && (
        <div className="card" style={{ borderColor: 'var(--blue)' }}>
          <div className="h-sec"><span className="h-sec-title">{editing ? `แก้ไขข้อมูล · ${editing.ot_id}` : 'เพิ่มนักกิจกรรมบำบัดใหม่'}</span></div>
          <div className="grid2">
            <Field label="ชื่อ" req><input className="inp" name="firstName" value={form.firstName} onChange={ch} placeholder="ระบุชื่อ" /></Field>
            <Field label="นามสกุล" req><input className="inp" name="lastName" value={form.lastName} onChange={ch} placeholder="ระบุนามสกุล" /></Field>
            <Field label="เลขใบอนุญาต" req><input className="inp mono" name="licenseNumber" value={form.licenseNumber} onChange={ch} placeholder="กภ.XXXXX" /></Field>
            <Field label="เบอร์ติดต่อ" req><input className="inp mono" name="phone" value={form.phone} onChange={ch} placeholder="08X-XXX-XXXX" /></Field>
            <Field label="อีเมล"><input className="inp" name="email" value={form.email} onChange={ch} placeholder="example@mail.com" /></Field>
            <Field label="เพศ"><select className="inp" name="gender" value={form.gender} onChange={ch}><option value="">เลือก...</option><option value="ชาย">ชาย</option><option value="หญิง">หญิง</option></select></Field>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost btn-sm" onClick={closeForm}>ยกเลิก</button>
            <button className="btn btn-sm" onClick={save} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </div>
      )}

      <div className="grid3">
        <div className="card"><div className="eyebrow">ทั้งหมด</div><div className="big">{total}<span className="big-unit">คน</span></div></div>
        <div className="card" style={{ background: 'var(--green-t)', borderColor: '#d9e9d4' }}><div className="eyebrow">ปฏิบัติงาน</div><div className="big" style={{ color: 'var(--green)' }}>{total}<span className="big-unit">คน</span></div></div>
        <div className="card"><div className="eyebrow">เคสรวม</div><div className="big">{caseTotal}<span className="big-unit">เคส</span></div></div>
      </div>

      <div className="toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="ค้นหาด้วยชื่อ, เลขใบอนุญาต..." />
        <button className="btn btn-ghost btn-sm" onClick={() => alert('Export Excel...')}>↓ Export</button>
      </div>

      <div className="card-0">
        <table className="data-table">
          <thead><tr><th>รหัส</th><th>ชื่อ-นามสกุล</th><th>เลขใบอนุญาต</th><th>เบอร์โทร</th><th>เคส</th><th>สถานะ</th><th></th></tr></thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>ไม่พบข้อมูล</td></tr>
              : filtered.map(t => (
                  <tr key={t.ot_id}>
                    <td className="mono">{t.ot_id}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="av" style={{ background: 'var(--blue)', width: 28, height: 28, fontSize: 10 }}>{(t.first_name[0] ?? '') + (t.last_name[0] ?? '')}</div><b>กภ. {t.first_name} {t.last_name}</b></div></td>
                    <td className="mono">{t.license_number}</td>
                    <td className="mono">{t.phone ?? '—'}</td>
                    <td><b>{t.cases ?? '—'}</b> เคส</td>
                    <td><span className="pill pill-green">ปฏิบัติงาน</span></td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(t)}>แก้ไข</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => resetPassword(t)}>รีเซ็ตรหัสผ่าน</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => removeTherapist(t)}>ลบ</button>
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

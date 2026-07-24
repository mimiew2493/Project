import { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import Stepper from '../components/Stepper'

const Field = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <label className="field"><span>{label}{required && <b>*</b>}</span>{children}</label>
)

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', birthDate: '', gender: '',
    address: '', phone: '', email: '', caretaker: '',
    medicalCondition: '', weight: '',
  })
  const [saving, setSaving] = useState(false)
  const [therapists, setTherapists] = useState<any[]>([])
  const [selectedOt, setSelectedOt] = useState('')
  const [result, setResult] = useState<{ success: boolean; message: string; patientId?: string; hn?: string } | null>(null)

  // ดึงรายชื่อนักกายภาพจาก Backend
  useEffect(() => {
    fetch('http://localhost:3000/api/therapists')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTherapists(data)
      })
      .catch(() => {})
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.birthDate || !form.gender || !form.phone || !form.address) {
      alert('กรุณากรอกข้อมูลที่จำเป็น (*) ให้ครบ')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, otId: selectedOt }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ success: true, message: 'ลงทะเบียนสำเร็จ', patientId: data.patient_id, hn: data.hn })
      } else {
        setResult({ success: false, message: data.error || 'เกิดข้อผิดพลาด' })
      }
    } catch {
      setResult({ success: false, message: 'ไม่สามารถเชื่อมต่อ Backend ได้' })
    }
    setSaving(false)
  }

  const resetForm = () => {
    setResult(null)
    setForm({ firstName: '', lastName: '', birthDate: '', gender: '', address: '', phone: '', email: '', caretaker: '', medicalCondition: '', weight: '' })
    setSelectedOt('')
  }

  if (result) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{result.success ? '✅' : '❌'}</div>
        <h2 style={{ marginBottom: 8 }}>{result.message}</h2>
        {result.success && (
          <div style={{ marginBottom: 20, color: '#666' }}>
            <p>รหัสผู้ป่วย: <strong style={{ color: '#0b7a5b', fontSize: 18 }}>{result.patientId}</strong></p>
          </div>
        )}
        <button className="btn primary" onClick={resetForm}>ลงทะเบียนคนใหม่</button>
      </div>
    )
  }

  return <>
    <PageHeader eyebrow="ผู้ป่วย · ลงทะเบียนใหม่" title="ลงทะเบียนผู้ป่วยใหม่" />
    <Stepper current={2}/>
    <div className="register-grid">
      <section className="panel form-panel">
        <h2>ข้อมูลส่วนตัว</h2>
        <div className="form-grid">
          <Field label="ชื่อ" required><input name="firstName" value={form.firstName} onChange={handleChange} placeholder="ระบุชื่อ"/></Field>
          <Field label="นามสกุล" required><input name="lastName" value={form.lastName} onChange={handleChange} placeholder="ระบุนามสกุล"/></Field>
          <Field label="วัน/เดือน/ปีเกิด" required><input name="birthDate" type="date" value={form.birthDate} onChange={handleChange}/></Field>
          <Field label="เพศ" required>
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="">เลือก...</option>
              <option value="ชาย">ชาย</option>
              <option value="หญิง">หญิง</option>
              <option value="ไม่ระบุ">ไม่ระบุ</option>
            </select>
          </Field>
          <Field label="ที่อยู่ปัจจุบัน" required><textarea name="address" value={form.address} onChange={handleChange} placeholder="บ้านเลขที่ ตำบล อำเภอ จังหวัด"/></Field>
          <Field label="เบอร์ติดต่อ" required><input name="phone" value={form.phone} onChange={handleChange} placeholder="08X-XXX-XXXX"/></Field>
          <Field label="อีเมล"><input name="email" type="email" value={form.email} onChange={handleChange} placeholder="example@mail.com"/></Field>
          <Field label="น้ำหนัก (kg)"><input name="weight" type="number" step="0.01" value={form.weight} onChange={handleChange} placeholder="เช่น 65.50"/></Field>
          <Field label="ผู้ดูแล / ผู้ประสาน" required><input name="caretaker" value={form.caretaker} onChange={handleChange} placeholder="ชื่อ–นามสกุล"/></Field>
        </div>
      </section>
      <aside className="register-side">
        <section className="panel">
          <h2>มอบหมายผู้ดูแลเคส</h2>
          <Field label="นักกายภาพบำบัด" required>
            <select value={selectedOt} onChange={(e) => setSelectedOt(e.target.value)}>
              <option value="">เลือกนักกายภาพ...</option>
              {therapists.map((t) => (
                <option key={t.ot_id} value={t.ot_id}>
                  กภ. {t.first_name} {t.last_name} — {t.license_number}
                </option>
              ))}
            </select>
          </Field>
          <Field label="บันทึกเพิ่มเติม">
            <input name="medicalCondition" value={form.medicalCondition} onChange={handleChange} placeholder="ข้อมูลอาการหรือหมายเหตุ"/>
          </Field>
        </section>
        <section className="panel">
          <h2>จับคู่อุปกรณ์</h2>
          <Field label="เลือกอุปกรณ์" required>
            <select><option>DEV-0155 — พร้อมใช้งาน</option></select>
          </Field>
          <div className="device-status"><span>สถานะอุปกรณ์</span><b style={{ color: '#0b7a5b' }}>พร้อมใช้งาน</b></div>
          <div className="device-status"><span>ส่งรหัสผ่านทาง</span><b style={{ color: '#2563eb' }}>SMS</b></div>
        </section>
        <div className="privacy">PDPA — ข้อมูลสุขภาพเป็นข้อมูลส่วนบุคคล โปรดตรวจสอบความถูกต้องและใช้เท่าที่จำเป็น</div>
        <div className="action-row">
          <button className="btn" onClick={resetForm}>ยกเลิก</button>
          <button className="btn primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกและส่งต่อ'}
          </button>
        </div>
      </aside>
    </div>
  </>
}
import { useState, useEffect, useMemo } from 'react'
import type { Therapist, Device, PatientAppointment, Program } from '../../types'
import type { ResumeTarget } from '../../App'
import Stepper from '../../components/Stepper'
import SideBadge from '../../components/SideBadge'
import { CheckCircleIcon, XCircleIcon, FileTextIcon, BarChartIcon, ClipboardIcon, ArrowLeftIcon, ArrowRightIcon, ArrowLeftRightIcon, CheckIcon } from '../../components/Icon'
import { STAGE_LABEL } from '../shared/ProgramLibraryPage'
import { API_BASE } from '../../config'

const TIMES = ['08', '09', '10', '11', '12', '13', '14', '15', '16']
const DAY_LABELS = ['จ', 'อ', 'พ', 'พฤ', 'ศ']
const STATUS_LABEL: Record<string, string> = { ACTIVE: 'ใช้งานได้', MAINTENANCE: 'ส่งซ่อม' }
const EXPORT_FORMATS = [
  { label: 'PDF', Icon: FileTextIcon },
  { label: 'Excel', Icon: BarChartIcon },
  { label: 'CSV', Icon: ClipboardIcon },
]

const startOfWeek = (base: Date) => {
  const d = new Date(base)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const toLocalYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const toLocalHM = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

type Side = 'ข้างซ้าย' | 'ข้างขวา' | 'ทั้งสองข้าง' | ''
const EMPTY_FORM = { firstName:'', lastName:'', birthDate:'', gender:'', address:'', phone:'', email:'', caretakerName:'', caretakerPhone:'', medicalCondition:'', weight:'' }
const EMPTY_APPT = { date:'', time:'', durationMin:'30', note:'' }

const Field = ({ label, req, children }: { label: React.ReactNode; req?: boolean; children: React.ReactNode }) => (
  <div className="field">
    <label className="field-label">{label} {req && <span className="req">*</span>}</label>
    {children}
  </div>
)

interface Props { step: number; setStep: (n: number) => void; onBack?: () => void; resume?: ResumeTarget | null }

export default function RegisterPage({ step, setStep, onBack, resume }: Props) {
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [otherAppts, setOtherAppts] = useState<PatientAppointment[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [selectedOt, setSelectedOt] = useState('')
  const [selectedDevice, setSelectedDevice] = useState('')
  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [side, setSide] = useState<Side>('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [appt, setAppt] = useState(EMPTY_APPT)
  const [ids, setIds] = useState<ResumeTarget | null>(resume ?? null)
  const [apptId, setApptId] = useState<string | null>(null)
  const [loadingResume, setLoadingResume] = useState(!!resume)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; patientId?: string; appointmentId?: string | null } | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/therapists`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setTherapists(d) }).catch(() => {})
    fetch(`${API_BASE}/api/devices`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setDevices(d) }).catch(() => {})
    fetch(`${API_BASE}/api/appointments`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setOtherAppts(d) }).catch(() => {})
    fetch(`${API_BASE}/api/programs`)
      .then(r => r.json()).then(d => { if (Array.isArray(d)) setPrograms(d) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!resume) return
    setLoadingResume(true)
    fetch(`${API_BASE}/api/register?patient_id=${resume.patientId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) return
        setIds(resume)
        setForm({
          firstName: d.first_name ?? '', lastName: d.last_name ?? '', birthDate: d.birth_date ?? '',
          gender: d.gender ?? '', address: d.address ?? '', phone: d.phone ?? '', email: d.email ?? '',
          caretakerName: d.caretaker_name ?? '', caretakerPhone: d.caretaker_phone ?? '',
          medicalCondition: d.medical_condition ?? '', weight: d.weight ?? '',
        })
        setSide((d.affected_side ?? '') as Side)
        if (d.appointment) {
          setApptId(d.appointment.appointment_id)
          setSelectedOt(d.appointment.ot_id ?? '')
          setSelectedDevice(d.appointment.device_id ?? '')
          const dt = new Date(d.appointment.appointment_date)
          setAppt({
            date: toLocalYMD(dt), time: toLocalHM(dt),
            durationMin: String(d.appointment.duration_min ?? 30), note: d.appointment.note ?? '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoadingResume(false))
  }, [resume?.patientId])

  const availableDevices = useMemo(
    () => devices.filter(d => d.status === 'ACTIVE' && (!d.holder_patient_id || d.holder_patient_id === ids?.patientId)),
    [devices, ids?.patientId]
  )

  const weekDays = useMemo(() => {
    const monday = startOfWeek(new Date())
    monday.setDate(monday.getDate() + weekOffset * 7)
    return Array.from({ length: 5 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })
  }, [weekOffset])

  const weekLabel = `${weekDays[0].getDate()} – ${weekDays[4].toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`

  const bookedCellMap = useMemo(() => {
    const map = new Map<string, PatientAppointment>()
    otherAppts.forEach(a => {
      if (a.appointment_id === apptId) return
      const d = new Date(a.appointment_date)
      const dayIdx = weekDays.findIndex(wd => wd.toDateString() === d.toDateString())
      if (dayIdx === -1) return
      map.set(`${String(d.getHours()).padStart(2, '0')}-${dayIdx}`, a)
    })
    return map
  }, [otherAppts, weekDays, apptId])

  const ch = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  // ขั้นที่ 1: รับเรื่อง + ลงทะเบียน — สร้างผู้ป่วยเข้าคิว (ถ้ายังไม่เคยสร้าง) แล้วบันทึกข้อมูลส่วนตัว + การแพทย์ + ข้างที่รักษา
  const goStep2 = async () => {
    if (!form.firstName || !form.lastName || !form.phone) { alert('กรุณาระบุชื่อ นามสกุล และเบอร์ติดต่อ'); return }
    if (!form.caretakerName || !form.caretakerPhone) { alert('กรุณาระบุชื่อและเบอร์โทรผู้ดูแลหลัก'); return }
    if (!side) { alert('กรุณาเลือกข้างที่รักษาก่อน'); return }
    setSaving(true)
    try {
      let currentIds = ids
      if (!currentIds) {
        const res = await fetch(`${API_BASE}/api/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, phone: form.phone }),
        })
        const data = await res.json()
        if (!res.ok) { alert(data.error ?? 'บันทึกไม่สำเร็จ'); return }
        currentIds = { patientId: data.patient_id, usersId: data.users_id }
        setIds(currentIds)
      }
      const res2 = await fetch(`${API_BASE}/api/register`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: currentIds.patientId, usersId: currentIds.usersId, step: 1,
          firstName: form.firstName, lastName: form.lastName, birthDate: form.birthDate || null,
          gender: form.gender, phone: form.phone, email: form.email,
          address: form.address, weight: form.weight, medicalCondition: form.medicalCondition,
          caretakerName: form.caretakerName, caretakerPhone: form.caretakerPhone,
          affectedSide: side,
        }),
      })
      const data2 = await res2.json()
      if (!res2.ok) { alert(data2.error ?? 'บันทึกไม่สำเร็จ'); return }
      setStep(2)
    } catch { alert('ไม่สามารถเชื่อมต่อ Backend ได้') }
    setSaving(false)
  }

  // ขั้นที่ 2: โปรแกรมการฝึก + จับคู่อุปกรณ์
  const goStep3 = async () => {
    if (!ids) { alert('เกิดข้อผิดพลาด กรุณาเริ่มจากขั้นที่ 1'); return }
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: ids.patientId, usersId: ids.usersId, step: 2 }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error ?? 'บันทึกไม่สำเร็จ'); return }
      if (selectedProgramId && selectedOt) {
        await fetch(`${API_BASE}/api/patient-programs`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: ids.patientId, programId: selectedProgramId, otId: selectedOt }),
        }).catch(() => null)
      }
      setStep(3)
    } catch { alert('ไม่สามารถเชื่อมต่อ Backend ได้') }
    setSaving(false)
  }

  // ขั้นที่ 3: นัดตรวจเช็คอุปกรณ์ครั้งแรก + ปิดการลงทะเบียน
  const finish = async () => {
    if (!appt.date || !appt.time) { alert('กรุณาเลือกวันที่และเวลานัด'); return }
    if (!ids) { alert('เกิดข้อผิดพลาด กรุณาเริ่มจากขั้นที่ 1'); return }
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: ids.patientId, usersId: ids.usersId, step: 3, appointmentId: apptId,
          otId: selectedOt || null, deviceId: selectedDevice || null,
          appointmentDate: `${appt.date}T${appt.time}:00`,
          durationMin: Number(appt.durationMin), treatedSide: side, appointmentNote: appt.note || null,
        }),
      })
      const data = await res.json()
      setResult(res.ok ? { success: true, message: 'ลงทะเบียนสำเร็จ', patientId: ids.patientId, appointmentId: data.appointment_id ?? apptId }
        : { success: false, message: data.error ?? 'เกิดข้อผิดพลาด' })
    } catch { setResult({ success: false, message: 'ไม่สามารถเชื่อมต่อ Backend ได้' }) }
    setSaving(false)
  }

  const reset = () => {
    setResult(null); setStep(1); setSide(''); setSelectedOt(''); setSelectedDevice(''); setSelectedProgramId(''); setWeekOffset(0)
    setForm(EMPTY_FORM); setAppt(EMPTY_APPT); setIds(null); setApptId(null)
  }

  if (loadingResume) return <div className="loading-box">กำลังโหลดข้อมูล...</div>

  if (result) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: result.success ? 'var(--green)' : 'var(--rose)' }}>
        {result.success ? <CheckCircleIcon size={56} /> : <XCircleIcon size={56} />}
      </div>
      <h2 style={{ marginBottom: 8 }}>{result.message}</h2>
      {result.success && (
        <>
          <p style={{ color: 'var(--green)', fontSize: 18, marginBottom: 6 }}>รหัสผู้ป่วย: <strong>{result.patientId}</strong></p>
          {side && <p style={{ fontSize: 13, color: 'var(--muted)' }}>ข้างที่รักษา: <SideBadge side={side} /></p>}
          {result.appointmentId && (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>
              นัดตรวจเช็คอุปกรณ์ครั้งแรก: <b className="mono">{result.appointmentId}</b> · {appt.date} {appt.time} น.
            </p>
          )}
          <div className="export-row" style={{ justifyContent: 'center', marginTop: 16 }}>
            {EXPORT_FORMATS.map(({ label, Icon }) => (
              <button key={label} className="export-btn" onClick={() => alert('Export ' + label + '...')}>
                <span className="export-icon"><Icon size={20} /></span>{label}
              </button>
            ))}
          </div>
        </>
      )}
      <div style={{ display: 'flex', gap: 9, justifyContent: 'center', marginTop: 20 }}>
        <button className="btn btn-ghost" onClick={onBack}>กลับหน้าคิว</button>
        <button className="btn" onClick={reset}>ลงทะเบียนคนใหม่</button>
      </div>
    </div>
  )

  return (
    <>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>ผู้ป่วย › <b style={{ color: 'var(--ink)' }}>{ids ? `ดำเนินการต่อ · ${ids.patientId}` : 'ลงทะเบียนใหม่'}</b></div>
      <h1 className="page-title" style={{ marginBottom: 16 }}>ลงทะเบียนผู้ป่วยใหม่</h1>
      <Stepper current={step} />

      {/* ขั้นที่ 1: รับเรื่อง + ลงทะเบียนข้อมูลเต็ม + เลือกข้าง */}
      {step === 1 && (
        <div className="reg-grid">
          <div className="stack">
            <div className="card">
              <div className="h-sec"><span className="h-sec-title">ข้อมูลเบื้องต้น</span></div>
              <div className="grid2">
                <Field label="ชื่อ" req><input className="inp" name="firstName" value={form.firstName} onChange={ch} placeholder="ระบุชื่อ" /></Field>
                <Field label="นามสกุล" req><input className="inp" name="lastName" value={form.lastName} onChange={ch} placeholder="ระบุนามสกุล" /></Field>
                <Field label="วัน/เดือน/ปีเกิด" req><input className="inp" name="birthDate" type="date" value={form.birthDate} onChange={ch} /></Field>
                <Field label="เพศ" req>
                  <select className="inp" name="gender" value={form.gender} onChange={ch}>
                    <option value="">เลือก...</option><option value="ชาย">ชาย</option><option value="หญิง">หญิง</option><option value="ไม่ระบุ">ไม่ระบุ</option>
                  </select>
                </Field>
              </div>
              <Field label="ที่อยู่ปัจจุบัน" req><textarea className="inp" name="address" value={form.address} onChange={ch} rows={2} placeholder="บ้านเลขที่ ตำบล อำเภอ จังหวัด" /></Field>
              <div className="grid2">
                <Field label="เบอร์ติดต่อ" req><input className="inp mono" name="phone" value={form.phone} onChange={ch} placeholder="08X-XXX-XXXX" /></Field>
                <Field label="อีเมล"><input className="inp" name="email" value={form.email} onChange={ch} placeholder="example@mail.com" /></Field>
                <Field label="น้ำหนัก (kg)"><input className="inp" name="weight" type="number" step="0.01" value={form.weight} onChange={ch} placeholder="65.50" /></Field>
                <Field label="ชื่อผู้ดูแลหลัก" req><input className="inp" name="caretakerName" value={form.caretakerName} onChange={ch} placeholder="เช่น นางสมศรี ใจดี (มารดา)" /></Field>
                <Field label="เบอร์โทรผู้ดูแลหลัก" req><input className="inp mono" name="caretakerPhone" value={form.caretakerPhone} onChange={ch} placeholder="08X-XXX-XXXX" /></Field>
              </div>
            </div>
            <div className="card">
              <div className="h-sec"><span className="h-sec-title">ข้อมูลทางการแพทย์</span></div>
              <div className="grid2">
                <Field label="ระยะ ALS" req>
                  <select className="inp"><option>ระยะแรก (Flaccid)</option><option>ระยะเกร็ง (Spastic)</option><option>ระยะฟื้นตัว (Recovery)</option></select>
                </Field>
                <Field label="ความรุนแรง">
                  <select className="inp"><option>เล็กน้อย</option><option>ปานกลาง</option><option>รุนแรง</option></select>
                </Field>
              </div>
              <Field label="ข้างที่รักษา" req>
                <div className="side-selector">
                  {(['ข้างซ้าย', 'ข้างขวา', 'ทั้งสองข้าง'] as Side[]).map(s => (
                    <button key={s} className={`side-btn ${side === s ? 'active' : ''}`} onClick={() => setSide(s)}>
                      <span className="side-icon">{s === 'ข้างซ้าย' ? <ArrowLeftIcon size={22} /> : s === 'ข้างขวา' ? <ArrowRightIcon size={22} /> : <ArrowLeftRightIcon size={22} />}</span>
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="หมายเหตุเพิ่มเติม">
                <textarea className="inp" name="medicalCondition" value={form.medicalCondition} onChange={ch} rows={2} placeholder="อาการเพิ่มเติม ประวัติอื่นๆ" />
              </Field>
            </div>
          </div>
          <div className="stack">
            <div className="card" style={{ background: 'var(--green-t)', borderColor: '#d9e9d4' }}>
              <div className="eyebrow">รหัสผู้ป่วย</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{ids?.patientId ?? 'ออกให้เมื่อบันทึก'}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>สร้างอัตโนมัติเมื่อบันทึก (เรียงลำดับ)</div>
            </div>
            <div className="card">
              <div className="h-sec"><span className="h-sec-title">มอบหมายผู้ดูแลเคส</span></div>
              <Field label="นักกิจกรรมบำบัด" req>
                <select className="inp" value={selectedOt} onChange={e => setSelectedOt(e.target.value)}>
                  <option value="">เลือกนักกายภาพ...</option>
                  {therapists.map(t => <option key={t.ot_id} value={t.ot_id}>กภ. {t.first_name} {t.last_name} — {t.license_number}</option>)}
                </select>
              </Field>
            </div>
            {side && (
              <div className="summary-card">
                <div className="h-sec"><span className="h-sec-title">สรุปข้อมูลการรักษา</span></div>
                <div className="kv"><span>ข้างที่รักษา</span><SideBadge side={side} /></div>
              </div>
            )}
            <div className="note note-pdpa"><b>PDPA</b> — ข้อมูลสุขภาพเป็นข้อมูลอ่อนไหว ต้องบันทึกความยินยอมก่อนกดบันทึก</div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={onBack} disabled={saving}>ยกเลิก</button>
              <button className="btn" onClick={goStep2} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึกและไปขั้นถัดไป →'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ขั้นที่ 2: โปรแกรมการฝึก + จับคู่อุปกรณ์ */}
      {step === 2 && (
        <div className="reg-grid">
          <div className="card">
            <div className="h-sec"><span className="h-sec-title">โปรแกรมการฝึกเริ่มต้น</span></div>
            <Field label="เลือกโปรแกรมจากคลังโปรแกรมฝึก">
              <select className="inp" value={selectedProgramId} onChange={e => setSelectedProgramId(e.target.value)}>
                <option value="">ยังไม่กำหนดโปรแกรม (ให้นักกายภาพกำหนดทีหลัง)</option>
                {(['FLACCID', 'SPASTIC', 'RECOVERY'] as const).map(stage => {
                  const opts = programs.filter(p => p.target_stage === stage && p.status !== 'INACTIVE')
                  if (opts.length === 0) return null
                  return (
                    <optgroup key={stage} label={STAGE_LABEL[stage]}>
                      {opts.map(p => <option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}
                    </optgroup>
                  )
                })}
              </select>
            </Field>
            {programs.length === 0 && (
              <div className="note" style={{ marginBottom: 12 }}>ยังไม่มีโปรแกรมในคลัง — ให้นักกายภาพสร้างโปรแกรมได้ที่หน้า "คลังโปรแกรมฝึก"</div>
            )}
            <div className="h-sec" style={{ marginTop: 16 }}><span className="h-sec-title">จ่ายอุปกรณ์</span></div>
            <Field label="เลือกอุปกรณ์ว่าง">
              <select className="inp" value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)}>
                <option value="">ไม่จ่ายอุปกรณ์ตอนนี้</option>
                {availableDevices.map(d => <option key={d.device_id} value={d.device_id}>{d.device_id} — {d.device_name}</option>)}
              </select>
            </Field>
            {availableDevices.length === 0 && (
              <div className="note" style={{ marginBottom: 12 }}>ตอนนี้ไม่มีอุปกรณ์ที่พร้อมจ่าย — ไปเพิ่ม/ปล่อยอุปกรณ์ได้ที่หน้าคลังอุปกรณ์</div>
            )}
            {selectedDevice && (() => {
              const d = devices.find(x => x.device_id === selectedDevice)
              if (!d) return null
              return (
                <>
                  <div className="kv"><span>สถานะอุปกรณ์</span><b style={{ color: 'var(--green)' }}>{STATUS_LABEL[d.status] ?? d.status}</b></div>
                  <div className="kv"><span>หมายเลขซีเรียล</span><b className="mono">{d.serial_number}</b></div>
                </>
              )
            })()}
          </div>
          <div className="stack">
            <div className="summary-card">
              <div className="h-sec"><span className="h-sec-title">สรุปเบื้องต้น</span></div>
              <div className="kv"><span>รหัสผู้ป่วย</span><b className="mono" style={{ color: 'var(--green)' }}>{ids?.patientId}</b></div>
              <div className="kv"><span>ชื่อ-นามสกุล</span><b>{form.firstName} {form.lastName}</b></div>
              <div className="kv"><span>ข้างที่รักษา</span><SideBadge side={side} /></div>
              <div className="kv"><span>นักกายภาพ</span><b>{therapists.find(t => t.ot_id === selectedOt)?.first_name ?? 'ยังไม่ได้เลือก'}</b></div>
              <div className="kv"><span>อุปกรณ์</span><b className="mono">{selectedDevice || 'ยังไม่ได้เลือก'}</b></div>
              <div className="kv"><span>โปรแกรมการฝึก</span><b>{programs.find(p => p.program_id === selectedProgramId)?.program_name ?? 'ยังไม่ได้เลือก'}</b></div>
            </div>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={saving}>← ย้อนกลับ</button>
              <button className="btn" onClick={goStep3} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึกและไปขั้นถัดไป →'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ขั้นที่ 3: นัดตรวจเช็คอุปกรณ์ครั้งแรก + สรุป */}
      {step === 3 && (
        <>
          <div className="card">
            <div className="h-sec"><span className="h-sec-title">เลือกวันและเวลานัดตรวจเช็คอุปกรณ์ครั้งแรก</span></div>
            <p className="page-sub">นัดหมายนี้คือนัดตรวจเช็คอุปกรณ์ IoT ไม่ใช่นัดตรวจอาการ — ไม่จำเป็นต้องนัดถี่</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w - 1)}>← สัปดาห์ก่อน</button>
              <div style={{ flex: 1, textAlign: 'center', fontWeight: 600, padding: 6 }}>{weekLabel}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w + 1)}>สัปดาห์ถัดไป →</button>
              {weekOffset !== 0 && <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(0)}>สัปดาห์นี้</button>}
            </div>
            <div className="time-grid" style={{ gridTemplateColumns: '70px repeat(5,1fr)' }}>
              <div className="time-header" />{weekDays.map((d, i) => <div key={i} className="time-header">{DAY_LABELS[i]} {d.getDate()}</div>)}
              {TIMES.filter(h => h !== '12').map(h => (
                <>
                  <div key={h + '-label'} className="time-label mono">{h}:00<br /><small>–{String(Number(h) + 1).padStart(2, '0')}:00</small></div>
                  {weekDays.map((d, ci) => {
                    const booked = bookedCellMap.get(`${h}-${ci}`)
                    const isSelected = appt.date === toLocalYMD(d) && appt.time === `${h}:00`
                    if (booked) {
                      return (
                        <div key={ci} className="time-slot">
                          <div className="appt-block" style={{ background: 'var(--blue-t)' }}>
                            <b>{booked.patient_name ? `${booked.patient_name} ${booked.patient_lastname ?? ''}`.trim() : booked.patient_id}</b><br />
                            <span style={{ color: 'var(--muted)' }}>{booked.therapist_name ? `กภ. ${booked.therapist_name}` : 'ยังไม่มอบหมาย'} · {booked.duration_min} นาที</span>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div key={ci} className="time-slot time-slot-empty" style={{ cursor: 'pointer' }}
                           onClick={() => setAppt(p => ({ ...p, date: toLocalYMD(d), time: `${h}:00` }))}>
                        {isSelected ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckIcon size={12} /> เลือกแล้ว</span> : '+ ว่าง'}
                      </div>
                    )
                  })}
                </>
              ))}
            </div>
            <div className="note" style={{ marginTop: 16 }}>ช่องสีฟ้าคือคิวที่มีนัดจริงอยู่แล้วในระบบ (ข้อมูลจากตาราง appointments) — เลือกได้เฉพาะช่องว่าง</div>

            <div className="h-sec" style={{ marginTop: 16 }}><span className="h-sec-title">รายละเอียดนัดที่จะบันทึก</span></div>
            <div className="grid2">
              <Field label="วันที่นัด" req>
                <input className="inp" type="date" value={appt.date}
                       onChange={e => setAppt(p => ({ ...p, date: e.target.value }))} />
              </Field>
              <Field label="เวลานัด" req>
                <input className="inp" type="time" value={appt.time}
                       onChange={e => setAppt(p => ({ ...p, time: e.target.value }))} />
              </Field>
              <Field label="ระยะเวลา">
                <select className="inp" value={appt.durationMin}
                        onChange={e => setAppt(p => ({ ...p, durationMin: e.target.value }))}>
                  <option value="30">30 นาที</option>
                  <option value="60">1 ชม.</option>
                </select>
              </Field>
            </div>
            <Field label="หมายเหตุการนัด">
              <input className="inp" value={appt.note} placeholder="เช่น ให้ญาติมาด้วย"
                     onChange={e => setAppt(p => ({ ...p, note: e.target.value }))} />
            </Field>

            <div className="summary-card" style={{ marginTop: 16 }}>
              <div className="h-sec"><span className="h-sec-title">สรุปการลงทะเบียน</span></div>
              <div className="kv"><span>รหัสผู้ป่วย</span><b className="mono" style={{ color: 'var(--green)' }}>{ids?.patientId}</b></div>
              <div className="kv"><span>ชื่อ-นามสกุล</span><b>{form.firstName} {form.lastName}</b></div>
              <div className="kv"><span>ข้างที่รักษา</span><SideBadge side={side} /></div>
              <div className="kv"><span>นักกายภาพ</span><b>{therapists.find(t => t.ot_id === selectedOt)?.first_name ?? 'ยังไม่ได้เลือก'}</b></div>
              <div className="kv"><span>อุปกรณ์</span><b className="mono">{selectedDevice || 'ยังไม่ได้เลือก'}</b></div>
              <div className="kv"><span>โปรแกรมการฝึก</span><b>{programs.find(p => p.program_id === selectedProgramId)?.program_name ?? 'ยังไม่ได้เลือก'}</b></div>
              <div className="kv"><span>นัดตรวจเช็คอุปกรณ์</span><b>{appt.date && appt.time ? `${appt.date} · ${appt.time} น. (${appt.durationMin} นาที)` : 'ยังไม่ได้เลือก'}</b></div>
            </div>
            <div className="note note-pdpa" style={{ marginTop: 12 }}><b>PDPA</b> — ข้อมูลสุขภาพเป็นข้อมูลอ่อนไหว ต้องบันทึกความยินยอมก่อน</div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setStep(2)} disabled={saving}>← ย้อนกลับ</button>
            <button className="btn btn-success" onClick={finish} disabled={saving}>
              {saving ? 'กำลังบันทึก...' : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><CheckIcon size={14} /> ยืนยันและเสร็จสิ้น</span>}
            </button>
          </div>
        </>
      )}
    </>
  )
}

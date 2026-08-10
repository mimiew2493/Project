import { useEffect, useState } from 'react'
import type { Patient, TherapySession, PatientAppointment } from '../../types'
import type { ResumeTarget } from '../../App'
import SearchBar from '../../components/SearchBar'
import Stepper from '../../components/Stepper'
import SideBadge from '../../components/SideBadge'
import SessionHistoryList from '../../components/SessionHistoryList'
import { XCircleIcon, ClipboardIcon, ClipboardListIcon, CheckIcon } from '../../components/Icon'
import { API_BASE } from '../../config'

const fmtAppt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

const FILTER_OPTIONS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'ข้างซ้าย', label: '← ซ้าย' },
  { key: 'ข้างขวา', label: 'ขวา →' },
  { key: 'ทั้งสองข้าง', label: '↔ ทั้งสองข้าง' },
] as const

const patientName = (p: Patient) => {
  const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()
  return name || p.patient_id
}

interface EditForm { firstName: string; lastName: string; phone: string; medicalCondition: string; weight: string; address: string }
const emptyEdit: EditForm = { firstName: '', lastName: '', phone: '', medicalCondition: '', weight: '', address: '' }

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="field"><label className="field-label">{label}</label>{children}</div>
)

interface Props { onRegister: (target?: ResumeTarget & { step: number }) => void }

export default function PatientsPage({ onRegister }: Props) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterSide, setFilterSide] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>(emptyEdit)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)
  const [historyLoadingId, setHistoryLoadingId] = useState<string | null>(null)
  const [historyCache, setHistoryCache] = useState<Record<string, TherapySession[]>>({})
  const [pendingAppts, setPendingAppts] = useState<PatientAppointment[]>([])
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const load = () => {
    fetch(`${API_BASE}/api/patients?status=ALL`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPatients(d); else setError('โหลดข้อมูลไม่ได้'); setLoading(false) })
      .catch(() => { setError('ไม่สามารถเชื่อมต่อ Backend ได้'); setLoading(false) })
  }
  const loadPendingAppts = () => {
    fetch(`${API_BASE}/api/appointments`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPendingAppts(d.filter((a: PatientAppointment) => a.status === 'PROPOSED')) })
      .catch(() => {})
  }
  useEffect(load, [])
  useEffect(loadPendingAppts, [])

  const respondToAppt = async (appointmentId: string, status: 'SCHEDULED' | 'CANCELLED') => {
    setConfirmingId(appointmentId)
    const res = await fetch(`${API_BASE}/api/appointments`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointmentId, status }),
    }).catch(() => null)
    if (res?.ok) { showToast(status === 'SCHEDULED' ? 'ยืนยันนัดและแจ้งผู้ป่วยแล้ว' : 'ยกเลิกนัดที่เสนอมาแล้ว'); loadPendingAppts() }
    else alert('ดำเนินการไม่สำเร็จ')
    setConfirmingId(null)
  }

  const filtered = patients
    .filter(p => filterSide === 'all' || p.affected_side === filterSide)
    .filter(p => [patientName(p), p.patient_id, p.medical_condition, p.address]
      .join(' ').toLowerCase().includes(search.trim().toLowerCase()))

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const startEdit = (p: Patient) => {
    setEditingId(p.patient_id)
    setEditForm({
      firstName: p.first_name ?? '', lastName: p.last_name ?? '', phone: p.phone ?? '',
      medicalCondition: p.medical_condition ?? '', weight: p.weight ?? '', address: p.address ?? '',
    })
  }
  const cancelEdit = () => { setEditingId(null); setEditForm(emptyEdit) }
  const ch = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const saveEdit = async () => {
    const p = patients.find(x => x.patient_id === editingId)
    if (!p) return
    if (!editForm.firstName || !editForm.lastName) { alert('กรุณากรอกชื่อและนามสกุล'); return }
    setSaving(true)
    const res = await fetch(`${API_BASE}/api/register`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: p.patient_id, usersId: p.users_id,
        firstName: editForm.firstName, lastName: editForm.lastName, phone: editForm.phone,
        medicalCondition: editForm.medicalCondition, weight: editForm.weight, address: editForm.address,
      }),
    }).catch(() => null)
    if (res?.ok) { showToast('แก้ไขข้อมูลสำเร็จ'); cancelEdit(); load() }
    else alert('เกิดข้อผิดพลาด')
    setSaving(false)
  }

  const toggleHistory = (patientId: string) => {
    if (expandedHistoryId === patientId) { setExpandedHistoryId(null); return }
    setExpandedHistoryId(patientId)
    if (historyCache[patientId]) return
    setHistoryLoadingId(patientId)
    fetch(`${API_BASE}/api/sessions?patient_id=${patientId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setHistoryCache(prev => ({ ...prev, [patientId]: d })) })
      .catch(() => {})
      .finally(() => setHistoryLoadingId(null))
  }

  const removePatient = async (p: Patient) => {
    if (!confirm(`ยืนยันลบผู้ป่วย ${patientName(p)} (${p.patient_id})? การลบไม่สามารถย้อนกลับได้`)) return
    const res = await fetch(`${API_BASE}/api/patients?patient_id=${p.patient_id}`, { method: 'DELETE' }).catch(() => null)
    if (res?.ok) { showToast('ลบผู้ป่วยสำเร็จ'); load() }
    else alert('ลบไม่สำเร็จ')
  }

  if (loading) return <div className="loading-box">กำลังโหลด...</div>
  if (error) return (
    <div className="empty-box">
      <div className="empty-icon"><XCircleIcon size={48} /></div>
      <div className="empty-title">{error}</div>
      <button className="btn" style={{ marginTop: 12 }} onClick={() => window.location.reload()}>ลองใหม่</button>
    </div>
  )

  return (
    <>
      {toast && <div className="toast toast-success">{toast}</div>}
      <div className="h-sec">
        <div>
          <h1 className="page-title">ผู้ป่วยทั้งหมด</h1>
          <p className="page-sub">รวมผู้ป่วยทุกสถานะ ทั้งที่ลงทะเบียนครบแล้วและที่ยังอยู่ระหว่างคิว</p>
        </div>
        <button className="btn btn-sm" onClick={() => onRegister()}>+ รับผู้ป่วยใหม่</button>
      </div>

      {pendingAppts.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--blue)' }}>
          <div className="h-sec"><span className="h-sec-title">นัดที่นักกายภาพเสนอมา รอยืนยัน ({pendingAppts.length})</span></div>
          <div className="stack">
            {pendingAppts.map(a => (
              <div key={a.appointment_id} className="kv" style={{ display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <b style={{ fontSize: 12.5 }}>{a.patient_name} {a.patient_lastname} · {a.patient_id}</b>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {fmtAppt(a.appointment_date)} · {a.duration_min} นาที · เสนอโดย กภ. {a.therapist_name} {a.therapist_lastname}
                      {a.note ? ` · ${a.note}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" disabled={confirmingId === a.appointment_id}
                      onClick={() => respondToAppt(a.appointment_id, 'SCHEDULED')}>ยืนยันนัด</button>
                    <button className="btn btn-ghost btn-sm" disabled={confirmingId === a.appointment_id}
                      onClick={() => respondToAppt(a.appointment_id, 'CANCELLED')}>ยกเลิก</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingId && (
        <div className="card" style={{ borderColor: 'var(--blue)' }}>
          <div className="h-sec"><span className="h-sec-title">แก้ไขข้อมูลผู้ป่วย · {editingId}</span></div>
          <div className="grid2">
            <Field label="ชื่อ"><input className="inp" name="firstName" value={editForm.firstName} onChange={ch} placeholder="ระบุชื่อ" /></Field>
            <Field label="นามสกุล"><input className="inp" name="lastName" value={editForm.lastName} onChange={ch} placeholder="ระบุนามสกุล" /></Field>
            <Field label="เบอร์ติดต่อ"><input className="inp mono" name="phone" value={editForm.phone} onChange={ch} placeholder="08X-XXX-XXXX" /></Field>
            <Field label="น้ำหนัก (kg)"><input className="inp" name="weight" type="number" step="0.01" value={editForm.weight} onChange={ch} /></Field>
          </div>
          <Field label="ที่อยู่"><textarea className="inp" name="address" rows={2} value={editForm.address} onChange={ch} /></Field>
          <Field label="อาการ/หมายเหตุ"><textarea className="inp" name="medicalCondition" rows={2} value={editForm.medicalCondition} onChange={ch} /></Field>
          <div className="form-actions">
            <button className="btn btn-ghost btn-sm" onClick={cancelEdit} disabled={saving}>ยกเลิก</button>
            <button className="btn btn-sm" onClick={saveEdit} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
          </div>
        </div>
      )}

      <div className="toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="ค้นหาด้วยชื่อ....." />
        <div className="filter-pills">
          {FILTER_OPTIONS.map(f => (
            <button key={f.key} className={`filter-pill ${filterSide === f.key ? 'active' : ''}`}
              onClick={() => setFilterSide(f.key)}>{f.label}</button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => alert('Export Excel...')}>↓ Export</button>
      </div>

      <div className="result-count">พบ {filtered.length} รายการ{search ? ` สำหรับ "${search}"` : ''}</div>

      {filtered.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon"><ClipboardIcon size={48} /></div>
          <div className="empty-title">ไม่พบผู้ป่วยที่ตรงกับเงื่อนไข</div>
          <div className="empty-sub">ลองเปลี่ยนคำค้นหาหรือ filter</div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}
            onClick={() => { setSearch(''); setFilterSide('all') }}>ล้างตัวกรอง</button>
        </div>
      ) : (
        <div className="stack">
          {filtered.map((p, i) => {
            const completed = p.status === 'COMPLETED'
            return (
              <div className="patient-card" key={p.patient_id}>
                <div className="patient-top">
                  <div className="patient-identity">
                    <div className="av" style={{ background: 'var(--amber)' }}>{i + 1}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span className="patient-name">{patientName(p)}</span>
                        <SideBadge side={p.affected_side} />
                      </div>
                      <div className="patient-meta">
                        รหัส: {p.patient_id} · อาการ: {p.medical_condition ?? '—'} · น้ำหนัก: {p.weight ?? '—'} kg · วันที่: {p.register_date ?? '—'}
                      </div>
                    </div>
                  </div>
                  <div className="patient-actions">
                    {completed
                      ? <span className="pill pill-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckIcon size={11} /> เสร็จสิ้น</span>
                      : (
                        <>
                          <span className="pill pill-amber">ขั้นที่ {p.registration_step ?? 1} / 3</span>
                          <button className="btn btn-sm"
                            onClick={() => onRegister({ patientId: p.patient_id, usersId: p.users_id, step: p.registration_step ?? 1 })}>
                            ดำเนินการต่อ
                          </button>
                        </>
                      )}
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleHistory(p.patient_id)}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><ClipboardListIcon size={12} /> ประวัติการฝึก</span>
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>แก้ไข</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => removePatient(p)}>ลบ</button>
                  </div>
                </div>
                {!completed && <Stepper current={p.registration_step ?? 1} />}
                {expandedHistoryId === p.patient_id && (
                  <div className="card" style={{ marginTop: 12, background: 'var(--canvas)' }}>
                    <div className="h-sec"><span className="h-sec-title">ประวัติการฝึกจากอุปกรณ์ IoT</span></div>
                    <SessionHistoryList sessions={historyCache[p.patient_id] ?? []} loading={historyLoadingId === p.patient_id} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="note" style={{ marginTop: 16 }}>
        <b>ทำไมต้องมีคิวนี้</b> — บังคับให้ครบ 3 ขั้น (รับเรื่อง+ลงทะเบียน → นัดหมาย → จับคู่อุปกรณ์) ก่อนถือว่ารับเข้าการรักษา
      </div>
    </>
  )
}

import { useEffect, useState } from 'react'
import type { Patient, PatientAppointment, Device, TherapySession, Program, PatientProgram, SessionFeedback } from '../../types'
import SearchBar from '../../components/SearchBar'
import SideBadge from '../../components/SideBadge'
import SessionHistoryList from '../../components/SessionHistoryList'
import { ToolIcon, UserMdIcon, CalendarIcon, TrendingUpIcon } from '../../components/Icon'
import { API_BASE } from '../../config'

interface Props { otId: string; usersId: string }

const patientName = (p: Patient) => `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.patient_id

const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

const emptyLogForm = { sessionDate: '', durationMin: '20', totalReps: '' }
const emptyNewProgram = { programName: '', description: '', repeatCount: '3', sessionPerDay: '1', durationMin: '20' }
const emptyNextAppt = { date: '', time: '', durationMin: '60', note: '' }

const APPT_STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'ยืนยันนัดแล้ว', PROPOSED: 'เสนอแล้ว รอเวชระเบียนยืนยัน',
  COMPLETED: 'เสร็จสิ้น', CANCELLED: 'ยกเลิก', NO_SHOW: 'ไม่มาตามนัด',
}

export default function MyCasesPage({ otId, usersId }: Props) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<PatientAppointment[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [showLogForm, setShowLogForm] = useState(false)
  const [logForm, setLogForm] = useState(emptyLogForm)
  const [saving, setSaving] = useState(false)

  const [myPrograms, setMyPrograms] = useState<Program[]>([])
  const [currentProgram, setCurrentProgram] = useState<PatientProgram | null>(null)
  const [assignProgramId, setAssignProgramId] = useState('')
  const [showNewProgramForm, setShowNewProgramForm] = useState(false)
  const [newProgram, setNewProgram] = useState(emptyNewProgram)
  const [assigning, setAssigning] = useState(false)

  const [feedbackList, setFeedbackList] = useState<SessionFeedback[]>([])
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackSessionId, setFeedbackSessionId] = useState('')
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackSaving, setFeedbackSaving] = useState(false)

  const [showNextApptForm, setShowNextApptForm] = useState(false)
  const [nextAppt, setNextAppt] = useState(emptyNextAppt)
  const [proposingAppt, setProposingAppt] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/patients?status=ALL`).then(r => r.json()),
      fetch(`${API_BASE}/api/appointments`).then(r => r.json()),
      fetch(`${API_BASE}/api/devices`).then(r => r.json()),
      fetch(`${API_BASE}/api/programs?created_by=${usersId}`).then(r => r.json()),
    ])
      .then(([p, a, d, pr]) => {
        if (Array.isArray(p)) setPatients(p); if (Array.isArray(a)) setAppointments(a)
        if (Array.isArray(d)) setDevices(d); if (Array.isArray(pr)) setMyPrograms(pr)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [usersId])

  const reloadAppointments = () => {
    fetch(`${API_BASE}/api/appointments`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAppointments(d) })
      .catch(() => {})
  }

  const loadSessions = (patientId: string) => {
    setSessionsLoading(true)
    fetch(`${API_BASE}/api/sessions?patient_id=${patientId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSessions(d) })
      .catch(() => {})
      .finally(() => setSessionsLoading(false))
  }

  const loadProgram = (patientId: string) => {
    fetch(`${API_BASE}/api/patient-programs?patient_id=${patientId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCurrentProgram(d.find((x: PatientProgram) => x.status === 'ACTIVE') ?? d[0] ?? null) })
      .catch(() => {})
  }

  const loadFeedback = (patientId: string) => {
    fetch(`${API_BASE}/api/feedback?patient_id=${patientId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setFeedbackList(d) })
      .catch(() => {})
  }

  useEffect(() => {
    if (!selectedPatientId) return
    loadSessions(selectedPatientId)
    loadProgram(selectedPatientId)
    loadFeedback(selectedPatientId)
  }, [selectedPatientId])

  const saveSession = async () => {
    if (!selectedPatientId) return
    if (!logForm.durationMin || !logForm.totalReps) { alert('กรุณากรอกระยะเวลาและจำนวนครั้ง'); return }
    setSaving(true)
    const res = await fetch(`${API_BASE}/api/sessions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: selectedPatientId, otId, usersId,
        sessionDate: logForm.sessionDate || undefined,
        durationMin: logForm.durationMin, totalReps: logForm.totalReps,
      }),
    }).catch(() => null)
    if (res?.ok) { setShowLogForm(false); setLogForm(emptyLogForm); loadSessions(selectedPatientId); loadProgram(selectedPatientId) }
    else alert('บันทึกไม่สำเร็จ')
    setSaving(false)
  }

  const createProgram = async () => {
    if (!newProgram.programName) { alert('กรุณาระบุชื่อโปรแกรม'); return }
    setAssigning(true)
    const res = await fetch(`${API_BASE}/api/programs`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newProgram, usersId }),
    }).catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      const created = await fetch(`${API_BASE}/api/programs?created_by=${usersId}`).then(r => r.json())
      if (Array.isArray(created)) setMyPrograms(created)
      setAssignProgramId(data.program_id)
      setShowNewProgramForm(false)
      setNewProgram(emptyNewProgram)
    } else alert('สร้างโปรแกรมไม่สำเร็จ')
    setAssigning(false)
  }

  const assignProgram = async () => {
    if (!selectedPatientId || !assignProgramId) { alert('กรุณาเลือกโปรแกรม'); return }
    setAssigning(true)
    const res = await fetch(`${API_BASE}/api/patient-programs`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: selectedPatientId, programId: assignProgramId, otId }),
    }).catch(() => null)
    if (res?.ok) { loadProgram(selectedPatientId) }
    else alert('กำหนดโปรแกรมไม่สำเร็จ')
    setAssigning(false)
  }

  const proposeNextAppointment = async (bookDirectly: boolean) => {
    if (!selectedPatientId) return
    if (!nextAppt.date || !nextAppt.time) { alert('กรุณาเลือกวันที่และเวลานัด'); return }
    setProposingAppt(true)
    const res = await fetch(`${API_BASE}/api/appointments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: selectedPatientId, otId,
        appointmentDate: `${nextAppt.date}T${nextAppt.time}:00`,
        durationMin: nextAppt.durationMin, note: nextAppt.note || null,
        status: bookDirectly ? 'SCHEDULED' : 'PROPOSED',
      }),
    }).catch(() => null)
    if (res?.ok) { setShowNextApptForm(false); setNextAppt(emptyNextAppt); reloadAppointments() }
    else alert('บันทึกนัดไม่สำเร็จ')
    setProposingAppt(false)
  }

  const saveFeedback = async () => {
    if (!feedbackSessionId || !feedbackComment) { alert('กรุณาเลือกเซสชันและกรอกคำแนะนำ'); return }
    setFeedbackSaving(true)
    const res = await fetch(`${API_BASE}/api/feedback`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: feedbackSessionId, comment: feedbackComment }),
    }).catch(() => null)
    if (res?.ok && selectedPatientId) { setShowFeedbackForm(false); setFeedbackComment(''); setFeedbackSessionId(''); loadFeedback(selectedPatientId) }
    else alert('บันทึกคำแนะนำไม่สำเร็จ')
    setFeedbackSaving(false)
  }

  if (loading) return <div className="loading-box">กำลังโหลด...</div>

  const myAppts = appointments.filter(a => a.ot_id === otId)
  const cases = Array.from(new Set(myAppts.map(a => a.patient_id))).map(patientId => {
    const patient = patients.find(p => p.patient_id === patientId)
    const apptsForPatient = myAppts.filter(a => a.patient_id === patientId).sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
    return { patient, latest: apptsForPatient[0], apptCount: apptsForPatient.length, appts: apptsForPatient }
  }).filter((c): c is typeof c & { patient: Patient } => !!c.patient)

  const filtered = cases.filter(c =>
    (patientName(c.patient) + c.patient.patient_id + (c.patient.medical_condition ?? '')).toLowerCase().includes(search.toLowerCase()))

  if (selectedPatientId) {
    const selected = cases.find(c => c.patient.patient_id === selectedPatientId)
    if (!selected) { setSelectedPatientId(null); return null }
    const { patient, appts } = selected
    const device = appts[0]?.device_id ? devices.find(d => d.device_id === appts[0].device_id) : undefined

    return (
      <>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => setSelectedPatientId(null)}>← กลับไปรายชื่อเคส</button>

        <div className="h-sec">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 className="page-title">{patientName(patient)}</h1>
              <SideBadge side={patient.affected_side} />
            </div>
            <p className="page-sub">รหัส: {patient.patient_id} · อาการ: {patient.medical_condition ?? '—'} · น้ำหนัก: {patient.weight ?? '—'} kg</p>
          </div>
        </div>

        <div className="reg-grid">
          <div className="stack">
            <div className="card">
              <div className="h-sec"><span className="h-sec-title">ข้อมูลผู้ป่วย</span></div>
              <div className="kv"><span>ที่อยู่</span><b>{patient.address ?? '—'}</b></div>
              <div className="kv"><span>เบอร์ติดต่อ</span><b className="mono">{patient.phone ?? '—'}</b></div>
              <div className="kv"><span>วันที่ลงทะเบียน</span><b>{patient.register_date ?? '—'}</b></div>
              <div className="kv"><span>สถานะ</span><b>{patient.status === 'COMPLETED' ? 'ลงทะเบียนครบแล้ว' : 'อยู่ระหว่างลงทะเบียน'}</b></div>
            </div>

            <div className="card">
              <div className="h-sec">
                <span className="h-sec-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUpIcon size={15} /> พัฒนาการของผู้ป่วย</span>
                <button className="btn btn-sm" onClick={() => setShowLogForm(v => !v)}>{showLogForm ? 'ยกเลิก' : '+ บันทึกผลการฝึก'}</button>
              </div>

              {showLogForm && (
                <div className="grid3" style={{ marginBottom: 12, alignItems: 'end' }}>
                  <div className="field">
                    <label className="field-label">วันที่ฝึก</label>
                    <input className="inp" type="datetime-local" value={logForm.sessionDate}
                      onChange={e => setLogForm(p => ({ ...p, sessionDate: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="field-label">ระยะเวลา (นาที)</label>
                    <input className="inp" type="number" min="1" value={logForm.durationMin}
                      onChange={e => setLogForm(p => ({ ...p, durationMin: e.target.value }))} />
                  </div>
                  <div className="field">
                    <label className="field-label">จำนวนครั้ง (reps)</label>
                    <input className="inp" type="number" min="0" value={logForm.totalReps}
                      onChange={e => setLogForm(p => ({ ...p, totalReps: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <button className="btn btn-sm" onClick={saveSession} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
                  </div>
                </div>
              )}

              <SessionHistoryList sessions={sessions} loading={sessionsLoading} />
              {!sessionsLoading && sessions.length === 0 && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>กด "+ บันทึกผลการฝึก" ด้านบนเพื่อเริ่มบันทึก หรือรอข้อมูลจากอุปกรณ์ IoT ในอนาคต</div>
              )}
            </div>

            <div className="card">
              <div className="h-sec">
                <span className="h-sec-title">คำแนะนำที่ให้ผู้ป่วย</span>
                <button className="btn btn-sm" onClick={() => setShowFeedbackForm(v => !v)} disabled={sessions.length === 0}>
                  {showFeedbackForm ? 'ยกเลิก' : '+ ให้คำแนะนำ'}
                </button>
              </div>
              {sessions.length === 0 && <div className="note">ต้องมีเซสชันการฝึกอย่างน้อย 1 ครั้งก่อนถึงจะให้คำแนะนำได้</div>}

              {showFeedbackForm && (
                <div className="stack" style={{ marginBottom: 12 }}>
                  <div className="field">
                    <label className="field-label">อ้างอิงเซสชัน</label>
                    <select className="inp" value={feedbackSessionId} onChange={e => setFeedbackSessionId(e.target.value)}>
                      <option value="">เลือกเซสชัน...</option>
                      {sessions.map(s => <option key={s.session_id} value={s.session_id}>{fmt(s.session_date)} · {s.total_reps} ครั้ง</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label className="field-label">คำแนะนำ</label>
                    <textarea className="inp" rows={2} value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} placeholder="เช่น ควรลดความเร็วลงเล็กน้อย..." />
                  </div>
                  <button className="btn btn-sm" onClick={saveFeedback} disabled={feedbackSaving}>{feedbackSaving ? 'กำลังบันทึก...' : 'ส่งคำแนะนำ'}</button>
                </div>
              )}

              {feedbackList.length === 0 ? (
                <div className="note">ยังไม่เคยให้คำแนะนำผู้ป่วยคนนี้</div>
              ) : (
                <div className="stack">
                  {feedbackList.map(f => (
                    <div key={f.feedback_id} className="kv" style={{ display: 'block' }}>
                      <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>สำหรับเซสชันวันที่ {fmt(f.session_date)}</div>
                      <div style={{ fontSize: 12.5, marginTop: 2 }}>{f.comment}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="stack">
            <div className="card">
              <div className="h-sec"><span className="h-sec-title">โปรแกรมการฝึก</span></div>
              {currentProgram ? (
                <>
                  <div className="kv"><span>โปรแกรมปัจจุบัน</span><b>{currentProgram.program_name}</b></div>
                  <div className="kv"><span>เป้าหมาย</span><b>{currentProgram.repeat_count} ครั้ง/เซต · {currentProgram.session_per_day} เซต/วัน</b></div>
                  <div className="kv"><span>ระยะเวลา/ครั้ง</span><b>{Math.round(currentProgram.duration_sec / 60)} นาที</b></div>
                  {currentProgram.description && <div className="note" style={{ marginTop: 8 }}>{currentProgram.description}</div>}
                </>
              ) : (
                <div className="note">ยังไม่ได้กำหนดโปรแกรมการฝึกให้ผู้ป่วยคนนี้</div>
              )}

              <div className="field" style={{ marginTop: 12 }}>
                <label className="field-label">เปลี่ยน/กำหนดโปรแกรม</label>
                <select className="inp" value={assignProgramId} onChange={e => setAssignProgramId(e.target.value)}>
                  <option value="">เลือกโปรแกรม...</option>
                  {myPrograms.map(p => <option key={p.program_id} value={p.program_id}>{p.program_name}</option>)}
                </select>
              </div>
              <div className="form-actions" style={{ justifyContent: 'flex-start', gap: 8 }}>
                <button className="btn btn-sm" onClick={assignProgram} disabled={assigning || !assignProgramId}>{assigning ? 'กำลังบันทึก...' : 'กำหนดโปรแกรมนี้'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowNewProgramForm(v => !v)}>{showNewProgramForm ? 'ยกเลิก' : '+ สร้างโปรแกรมใหม่'}</button>
              </div>

              {showNewProgramForm && (
                <div className="stack" style={{ marginTop: 10 }}>
                  <div className="field"><label className="field-label">ชื่อโปรแกรม</label>
                    <input className="inp" value={newProgram.programName} onChange={e => setNewProgram(p => ({ ...p, programName: e.target.value }))} placeholder="เช่น โปรแกรมฟื้นฟูแขนระยะแรก" />
                  </div>
                  <div className="field"><label className="field-label">รายละเอียด</label>
                    <textarea className="inp" rows={2} value={newProgram.description} onChange={e => setNewProgram(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="grid3">
                    <div className="field"><label className="field-label">ครั้ง/เซต</label>
                      <input className="inp" type="number" min="1" value={newProgram.repeatCount} onChange={e => setNewProgram(p => ({ ...p, repeatCount: e.target.value }))} />
                    </div>
                    <div className="field"><label className="field-label">เซต/วัน</label>
                      <input className="inp" type="number" min="1" value={newProgram.sessionPerDay} onChange={e => setNewProgram(p => ({ ...p, sessionPerDay: e.target.value }))} />
                    </div>
                    <div className="field"><label className="field-label">นาที/ครั้ง</label>
                      <input className="inp" type="number" min="1" value={newProgram.durationMin} onChange={e => setNewProgram(p => ({ ...p, durationMin: e.target.value }))} />
                    </div>
                  </div>
                  <button className="btn btn-sm" onClick={createProgram} disabled={assigning}>{assigning ? 'กำลังบันทึก...' : 'สร้างโปรแกรม'}</button>
                </div>
              )}
            </div>

            <div className="card">
              <div className="h-sec"><span className="h-sec-title">อุปกรณ์ที่ใช้ล่าสุด</span></div>
              {device ? (
                <>
                  <div className="kv"><span>รหัสอุปกรณ์</span><b className="mono">{device.device_id}</b></div>
                  <div className="kv"><span>ชื่ออุปกรณ์</span><b>{device.device_name}</b></div>
                  <div className="kv"><span>สถานะ</span><b>{device.status}</b></div>
                </>
              ) : (
                <div className="note">นัดล่าสุดของผู้ป่วยยังไม่ได้ระบุอุปกรณ์</div>
              )}
            </div>

            <div className="card">
              <div className="h-sec">
                <span className="h-sec-title">ประวัตินัดหมายกับคุณ ({appts.length})</span>
                <button className="btn btn-sm" onClick={() => setShowNextApptForm(v => !v)}>{showNextApptForm ? 'ยกเลิก' : '+ เสนอนัดครั้งถัดไป'}</button>
              </div>

              {showNextApptForm && (
                <div className="stack" style={{ marginBottom: 12 }}>
                  <div className="grid3">
                    <div className="field">
                      <label className="field-label">วันที่นัด</label>
                      <input className="inp" type="date" value={nextAppt.date} onChange={e => setNextAppt(p => ({ ...p, date: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label className="field-label">เวลา</label>
                      <input className="inp" type="time" value={nextAppt.time} onChange={e => setNextAppt(p => ({ ...p, time: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label className="field-label">ระยะเวลา (นาที)</label>
                      <input className="inp" type="number" min="1" value={nextAppt.durationMin} onChange={e => setNextAppt(p => ({ ...p, durationMin: e.target.value }))} />
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">หมายเหตุ (เช่น ความถี่ที่แนะนำ)</label>
                    <input className="inp" value={nextAppt.note} onChange={e => setNextAppt(p => ({ ...p, note: e.target.value }))} placeholder="เช่น นัดทุก 2 สัปดาห์" />
                  </div>
                  <div className="form-actions" style={{ justifyContent: 'flex-start', gap: 8 }}>
                    <button className="btn btn-sm" onClick={() => proposeNextAppointment(false)} disabled={proposingAppt}>
                      {proposingAppt ? 'กำลังบันทึก...' : 'เสนอนัด (ให้เวชระเบียนยืนยัน)'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => proposeNextAppointment(true)} disabled={proposingAppt}>จองนัดเข้าระบบเลย</button>
                  </div>
                </div>
              )}

              <div className="stack">
                {appts.map(a => (
                  <div key={a.appointment_id} className="kv" style={{ display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <b style={{ fontSize: 12 }}>{fmt(a.appointment_date)}</b>
                      <span className={`pill ${a.status === 'SCHEDULED' ? 'pill-amber' : a.status === 'PROPOSED' ? 'pill-blue' : ''}`} style={{ fontSize: 10 }}>
                        {APPT_STATUS_LABEL[a.status] ?? a.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                      {a.duration_min} นาที{a.device_id && <><ToolIcon size={11} /> {a.device_id}</>}{a.note ? ` · ${a.note}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="h-sec">
        <div>
          <h1 className="page-title">เคสของฉัน</h1>
          <p className="page-sub">ผู้ป่วยที่มีนัดหมายกับคุณ — ดูข้อมูลเบื้องต้นและนัดล่าสุด</p>
        </div>
      </div>

      <div className="toolbar">
        <SearchBar value={search} onChange={setSearch} placeholder="ค้นหาด้วยชื่อ, รหัส, อาการ..." />
      </div>

      <div className="result-count">พบ {filtered.length} เคส</div>

      {filtered.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon"><UserMdIcon size={48} /></div>
          <div className="empty-title">ยังไม่มีเคสที่มอบหมายให้คุณ</div>
          <div className="empty-sub">เคสจะปรากฏที่นี่เมื่อมีนัดหมายที่มอบหมายให้คุณ</div>
        </div>
      ) : (
        <div className="stack">
          {filtered.map(({ patient, latest, apptCount }) => (
            <div className="patient-card" key={patient.patient_id} style={{ cursor: 'pointer' }} onClick={() => setSelectedPatientId(patient.patient_id)}>
              <div className="patient-top">
                <div className="patient-identity">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span className="patient-name">{patientName(patient)}</span>
                      <SideBadge side={patient.affected_side} />
                    </div>
                    <div className="patient-meta">
                      รหัส: {patient.patient_id} · อาการ: {patient.medical_condition ?? '—'} · น้ำหนัก: {patient.weight ?? '—'} kg
                    </div>
                  </div>
                </div>
                <span className="pill">{apptCount} นัด</span>
              </div>
              {latest && (
                <div className="patient-meta" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <CalendarIcon size={11} /> นัดล่าสุด: {fmt(latest.appointment_date)} · {latest.duration_min} นาที
                  {latest.device_id && <><ToolIcon size={11} /> {latest.device_id}</>}
                  {' · '}<span className={`pill ${latest.status === 'SCHEDULED' ? 'pill-amber' : ''}`} style={{ fontSize: 10 }}>{latest.status}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

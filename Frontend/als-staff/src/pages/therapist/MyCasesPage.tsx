import { useEffect, useState } from 'react'
import type { Patient, PatientAppointment, Device } from '../../types'
import SearchBar from '../../components/SearchBar'
import SideBadge from '../../components/SideBadge'

interface Props { otId: string }

interface TherapySession {
  session_id: string
  session_date: string
  duration_sec: number
  total_reps: number
  status: string
  program_id: string
  program_name: string
  movement_count: string | null
}

const patientName = (p: Patient) => `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.patient_id

const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

export default function MyCasesPage({ otId }: Props) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<PatientAppointment[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3000/api/patients?status=ALL').then(r => r.json()),
      fetch('http://localhost:3000/api/appointments').then(r => r.json()),
      fetch('http://localhost:3000/api/devices').then(r => r.json()),
    ])
      .then(([p, a, d]) => { if (Array.isArray(p)) setPatients(p); if (Array.isArray(a)) setAppointments(a); if (Array.isArray(d)) setDevices(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedPatientId) return
    setSessionsLoading(true)
    fetch(`http://localhost:3000/api/sessions?patient_id=${selectedPatientId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSessions(d) })
      .catch(() => {})
      .finally(() => setSessionsLoading(false))
  }, [selectedPatientId])

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
              <div className="h-sec"><span className="h-sec-title">ประวัติการฝึกจากอุปกรณ์ IoT</span></div>
              {sessionsLoading ? (
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>กำลังโหลด...</div>
              ) : sessions.length === 0 ? (
                <div className="note">
                  ยังไม่มีข้อมูลการฝึกส่งเข้าระบบสำหรับผู้ป่วยคนนี้ — ข้อมูลจะปรากฏที่นี่อัตโนมัติเมื่อมีการบันทึกเซสชันการฝึก (ตาราง therapy_sessions/movement_data) เข้ามาจริง
                </div>
              ) : (
                <div className="stack">
                  {sessions.map(s => (
                    <div key={s.session_id} className="kv" style={{ display: 'block' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <b>{fmt(s.session_date)}</b>
                        <span className="pill">{s.status}</span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                        {s.program_name} · {s.total_reps} ครั้ง · {Math.round(s.duration_sec / 60)} นาที
                        {s.movement_count ? ` · การเคลื่อนไหวจากอุปกรณ์ ${s.movement_count} ครั้ง` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="stack">
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
              <div className="h-sec"><span className="h-sec-title">ประวัตินัดหมายกับคุณ ({appts.length})</span></div>
              <div className="stack">
                {appts.map(a => (
                  <div key={a.appointment_id} className="kv" style={{ display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <b style={{ fontSize: 12 }}>{fmt(a.appointment_date)}</b>
                      <span className={`pill ${a.status === 'SCHEDULED' ? 'pill-amber' : ''}`} style={{ fontSize: 10 }}>{a.status}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.duration_min} นาที{a.device_id ? ` · 🔧 ${a.device_id}` : ''}{a.note ? ` · ${a.note}` : ''}</div>
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
          <div className="empty-icon">🧑‍⚕️</div>
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
                <div className="patient-meta" style={{ marginTop: 8 }}>
                  🗓 นัดล่าสุด: {fmt(latest.appointment_date)} · {latest.duration_min} นาที
                  {latest.device_id ? ` · 🔧 ${latest.device_id}` : ''}
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

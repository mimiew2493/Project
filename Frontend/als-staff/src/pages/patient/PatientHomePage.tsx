import { useEffect, useState } from 'react'
import type { Patient, PatientAppointment, Device } from '../../types'
import SideBadge from '../../components/SideBadge'

interface Props { patientId: string }

const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

const STEP_LABEL: Record<number, string> = { 1: 'รับเรื่อง + ลงทะเบียน', 2: 'รอนัดหมาย', 3: 'จับคู่อุปกรณ์' }

export default function PatientHomePage({ patientId }: Props) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appts, setAppts] = useState<PatientAppointment[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3000/api/patients?status=ALL').then(r => r.json()),
      fetch(`http://localhost:3000/api/appointments?patient_id=${patientId}`).then(r => r.json()),
      fetch('http://localhost:3000/api/devices').then(r => r.json()),
    ])
      .then(([p, a, d]) => {
        if (Array.isArray(p)) setPatient(p.find((x: Patient) => x.patient_id === patientId) ?? null)
        if (Array.isArray(a)) setAppts(a)
        if (Array.isArray(d)) setDevices(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [patientId])

  if (loading) return <div className="loading-box">กำลังโหลด...</div>
  if (!patient) return <div className="empty-box"><div className="empty-title">ไม่พบข้อมูลผู้ป่วย</div></div>

  const now = new Date()
  const nextAppt = appts.filter(a => new Date(a.appointment_date) >= now && a.status === 'SCHEDULED')
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0]
  const myDevice = devices.find(d => d.holder_patient_id === patientId)
  const name = `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim() || patient.patient_id

  return (
    <div className="stack">
      <div className="hero-card">
        <div style={{ fontSize: 19, fontWeight: 700 }}>สวัสดี, {name.split(' ')[0]} 👋</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>รหัส: {patient.patient_id}</div>
        <div style={{ marginTop: 10 }}>
          {patient.status === 'COMPLETED'
            ? <span className="pill pill-green">✓ ลงทะเบียนครบแล้ว</span>
            : <span className="pill pill-amber">อยู่ระหว่าง: {STEP_LABEL[patient.registration_step ?? 1] ?? '—'}</span>}
        </div>
      </div>

      <div className="card">
        <div className="h-sec"><span className="h-sec-title">ข้อมูลการรักษา</span></div>
        <div className="kv"><span>ข้างที่รักษา</span><SideBadge side={patient.affected_side} /></div>
        <div className="kv"><span>อาการ</span><b>{patient.medical_condition ?? '—'}</b></div>
        <div className="kv"><span>น้ำหนัก</span><b>{patient.weight ?? '—'} kg</b></div>
      </div>

      {myDevice && (
        <div className="card" style={{ display: 'flex', gap: 11, alignItems: 'center', background: 'var(--green-t)', borderColor: '#d9e9d4' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--green)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>🔧</div>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 12.5 }}>อุปกรณ์ของคุณ: {myDevice.device_name}</b>
            <div style={{ fontSize: 10.5, color: 'var(--muted)' }} className="mono">{myDevice.device_id}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="h-sec"><span className="h-sec-title">นัดหมายครั้งถัดไป</span></div>
        {nextAppt ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(nextAppt.appointment_date)}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>
              {nextAppt.therapist_name ? `กภ. ${nextAppt.therapist_name}` : 'ยังไม่มอบหมายนักกายภาพ'} · {nextAppt.duration_min} นาที
            </div>
          </>
        ) : (
          <div className="note">ยังไม่มีนัดหมายที่กำลังจะถึง</div>
        )}
      </div>
    </div>
  )
}

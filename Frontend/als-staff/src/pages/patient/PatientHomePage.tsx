import { useEffect, useState } from 'react'
import type { Patient, PatientAppointment, Device, TherapySession, PatientProgram, SessionFeedback, PageKey } from '../../types'
import { PlayCircle, Wifi, WifiOff, Battery, CalendarDays, MessageSquare, TrendingUp, CheckCircle2 } from 'lucide-react'
import { API_BASE } from '../../config'

interface Props { patientId: string; onNavigate: (p: PageKey) => void }

const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
const STEP_LABEL: Record<number, string> = { 1: 'รับเรื่อง + ลงทะเบียน', 2: 'โปรแกรมฝึก + จับคู่อุปกรณ์', 3: 'นัดตรวจเช็คอุปกรณ์' }

export default function PatientHomePage({ patientId, onNavigate }: Props) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appts, setAppts] = useState<PatientAppointment[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [program, setProgram] = useState<PatientProgram | null>(null)
  const [feedback, setFeedback] = useState<SessionFeedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/patients?status=ALL`).then(r => r.json()),
      fetch(`${API_BASE}/api/appointments?patient_id=${patientId}`).then(r => r.json()),
      fetch(`${API_BASE}/api/devices`).then(r => r.json()),
      fetch(`${API_BASE}/api/sessions?patient_id=${patientId}`).then(r => r.json()),
      fetch(`${API_BASE}/api/patient-programs?patient_id=${patientId}`).then(r => r.json()),
      fetch(`${API_BASE}/api/feedback?patient_id=${patientId}`).then(r => r.json()),
    ])
      .then(([p, a, d, s, pp, fb]) => {
        if (Array.isArray(p)) setPatient(p.find((x: Patient) => x.patient_id === patientId) ?? null)
        if (Array.isArray(a)) setAppts(a)
        if (Array.isArray(d)) setDevices(d)
        if (Array.isArray(s)) setSessions(s)
        if (Array.isArray(pp)) setProgram(pp.find((x: PatientProgram) => x.status === 'ACTIVE') ?? pp[0] ?? null)
        if (Array.isArray(fb)) setFeedback(fb)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [patientId])

  if (loading) return <div className="py-16 text-center text-[12px] text-dash-text-soft">กำลังโหลด...</div>
  if (!patient) return <div className="py-16 text-center text-[13px] font-semibold text-dash-text">ไม่พบข้อมูลผู้ป่วย</div>

  const now = new Date()
  const nextAppt = appts.filter(a => new Date(a.appointment_date) >= now && a.status === 'SCHEDULED')
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0]
  const myDevice = devices.find(d => d.holder_patient_id === patientId)
  const name = `${patient.first_name ?? ''} ${patient.last_name ?? ''}`.trim() || patient.patient_id
  const totalReps = sessions.reduce((s, x) => s + x.total_reps, 0)
  const connected = myDevice?.connection_status === 'CONNECTED'
  const latestFeedback = feedback[0]

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-dash-primary to-dash-cyan p-5 text-white shadow-lg shadow-dash-primary/25">
        <div className="text-[18px] font-bold">สวัสดี, {name.split(' ')[0]}</div>
        <div className="mt-0.5 text-[11px] text-white/80">รหัสผู้ป่วย: {patient.patient_id}</div>
        <div className="mt-3">
          {patient.status === 'COMPLETED' ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold">
              <CheckCircle2 size={12} /> ลงทะเบียนครบแล้ว
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold">
              อยู่ระหว่าง: {STEP_LABEL[patient.registration_step ?? 1] ?? '—'}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#cfe4e0] bg-white p-5">
        <div className="mb-1 text-[12px] font-semibold text-dash-text-soft">โปรแกรมฝึกวันนี้</div>
        {program ? (
          <>
            <div className="text-[15px] font-bold text-dash-text">{program.program_name}</div>
            <div className="mt-1 text-[11.5px] text-dash-text-soft">
              เป้าหมาย {program.repeat_count} ครั้ง/เซต · {program.session_per_day} เซต/วัน · {Math.round(program.duration_sec / 60)} นาที/ครั้ง
            </div>
          </>
        ) : (
          <div className="text-[12px] text-dash-text-soft">ยังไม่ได้รับมอบหมายโปรแกรมการฝึก</div>
        )}
        <button
          onClick={() => onNavigate('patient-stats')}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-dash-primary py-3 text-[13.5px] font-bold text-white shadow-md shadow-dash-primary/25 transition hover:brightness-105"
        >
          <PlayCircle size={18} /> เริ่มโปรแกรมฝึกวันนี้
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onNavigate('patient-stats')} className="rounded-2xl border border-[#cfe4e0] bg-white p-4 text-left">
          <TrendingUp size={16} className="text-dash-primary" />
          <div className="mt-2 text-[19px] font-bold text-dash-text">{totalReps}</div>
          <div className="text-[10.5px] text-dash-text-soft">ครั้งสะสมทั้งหมด</div>
        </button>
        <div className="rounded-2xl border border-[#cfe4e0] bg-white p-4">
          {connected ? <Wifi size={16} className="text-[#3fae7d]" /> : <WifiOff size={16} className="text-dash-text-soft" />}
          <div className="mt-2 flex items-center gap-1.5">
            <span className={`text-[13px] font-bold ${connected ? 'text-[#3fae7d]' : 'text-dash-text-soft'}`}>{connected ? 'เชื่อมต่อแล้ว' : 'ยังไม่เชื่อมต่อ'}</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[10.5px] text-dash-text-soft">
            {myDevice ? <><Battery size={11} /> {myDevice.battery_level != null ? `${myDevice.battery_level}%` : 'อุปกรณ์ ' + myDevice.device_id}</> : 'ยังไม่มีอุปกรณ์'}
          </div>
        </div>
      </div>

      <button onClick={() => onNavigate('patient-appointments')} className="flex w-full items-center gap-3 rounded-2xl border border-[#cfe4e0] bg-white p-4 text-left">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-dash-primary-light text-dash-primary">
          <CalendarDays size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] text-dash-text-soft">นัดหมายครั้งถัดไป</div>
          {nextAppt ? (
            <div className="truncate text-[13px] font-semibold text-dash-text">
              {fmt(nextAppt.appointment_date)} {nextAppt.therapist_name ? `· กภ.${nextAppt.therapist_name}` : ''}
            </div>
          ) : (
            <div className="text-[12.5px] text-dash-text-soft">ยังไม่มีนัดหมายที่กำลังจะถึง</div>
          )}
        </div>
      </button>

      {latestFeedback && (
        <button onClick={() => onNavigate('patient-feedback')} className="flex w-full items-start gap-3 rounded-2xl border border-[#cfe4e0] bg-white p-4 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f0fe] text-[#8a6ce8]">
            <MessageSquare size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] text-dash-text-soft">คำแนะนำล่าสุดจาก กภ.{latestFeedback.therapist_name ?? ''}</div>
            <div className="mt-0.5 line-clamp-2 text-[12.5px] text-dash-text">{latestFeedback.comment}</div>
          </div>
        </button>
      )}
    </div>
  )
}

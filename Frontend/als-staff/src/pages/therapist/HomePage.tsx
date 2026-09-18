import { useEffect, useMemo, useState } from 'react'
import type { TherapySession, Patient, PatientAppointment, Device, AuthUser } from '../../types'
import { Users, UserCheck, CalendarCheck2, AlertTriangle, Cpu } from 'lucide-react'
import TopHeader from '../../components/dashboard/TopHeader'
import SummaryCard from '../../components/dashboard/SummaryCard'
import LineChart from '../../components/dashboard/LineChart'
import AttentionPatientCard from '../../components/dashboard/AttentionPatientCard'
import SessionRow from '../../components/dashboard/SessionRow'
import AppointmentCalendar from '../../components/dashboard/AppointmentCalendar'
import DeviceStatusCard from '../../components/dashboard/DeviceStatusCard'
import { API_BASE } from '../../config'

interface Props { otId: string; firstName: string; user: AuthUser; onOpenCases?: () => void }

const toLocalYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const isSameDay = (a: Date, b: Date) => toLocalYMD(a) === toLocalYMD(b)
const patientName = (p?: Patient) => p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.patient_id : '—'

export default function HomePage({ otId, firstName, user, onOpenCases }: Props) {
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [appointments, setAppointments] = useState<PatientAppointment[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/sessions?ot_id=${otId}`).then(r => r.json()),
      fetch(`${API_BASE}/api/patients?status=ALL`).then(r => r.json()),
      fetch(`${API_BASE}/api/appointments`).then(r => r.json()),
      fetch(`${API_BASE}/api/devices`).then(r => r.json()),
    ])
      .then(([s, p, a, d]) => {
        if (Array.isArray(s)) setSessions(s)
        if (Array.isArray(p)) setPatients(p)
        if (Array.isArray(a)) setAppointments(a)
        if (Array.isArray(d)) setDevices(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [otId])

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const myAppts = useMemo(() => appointments.filter(a => a.ot_id === otId), [appointments, otId])
  const myPatientIds = useMemo(() => new Set(myAppts.map(a => a.patient_id)), [myAppts])
  const myPatients = useMemo(() => patients.filter(p => myPatientIds.has(p.patient_id)), [patients, myPatientIds])

  const findPatient = (id?: string) => patients.find(p => p.patient_id === id)

  const activePatientIds = new Set(sessions.filter(s => new Date(s.session_date) >= weekAgo).map(s => s.patient_id).filter(Boolean))
  const todaySessions = sessions.filter(s => isSameDay(new Date(s.session_date), now))
  const todayAppts = myAppts.filter(a => isSameDay(new Date(a.appointment_date), now) && a.status !== 'CANCELLED')

  const lastSessionByPatient = useMemo(() => {
    const map = new Map<string, TherapySession>()
    for (const s of sessions) {
      if (!s.patient_id) continue
      const cur = map.get(s.patient_id)
      if (!cur || new Date(s.session_date) > new Date(cur.session_date)) map.set(s.patient_id, s)
    }
    return map
  }, [sessions])

  const needsAttention = useMemo(() => {
    return myPatients
      .map(p => {
        const last = lastSessionByPatient.get(p.patient_id)
        const daysSince = last ? Math.floor((now.getTime() - new Date(last.session_date).getTime()) / 86400000) : null
        const flagged = daysSince === null || daysSince >= 7
        return { patient: p, last, daysSince, flagged }
      })
      .filter(x => x.flagged)
      .sort((a, b) => (b.daysSince ?? 999) - (a.daysSince ?? 999))
      .slice(0, 6)
  }, [myPatients, lastSessionByPatient, now])

  const chartData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now); d.setDate(d.getDate() - (13 - i)); return d
    })
    const byDay = new Map<string, number>()
    sessions.forEach(s => { const k = toLocalYMD(new Date(s.session_date)); byDay.set(k, (byDay.get(k) ?? 0) + s.total_reps) })
    return days.map(d => ({ label: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }), value: byDay.get(toLocalYMD(d)) ?? 0 }))
  }, [sessions, now])

  const calendarEvents = myAppts.map(a => ({
    date: a.appointment_date,
    label: `${a.appointment_date ? new Date(a.appointment_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : ''} · ${a.patient_name ?? ''} ${a.patient_lastname ?? ''}`.trim(),
    tone: a.status === 'COMPLETED' ? 'green' as const : a.status === 'CANCELLED' ? 'red' as const : a.status === 'PROPOSED' ? 'orange' as const : 'blue' as const,
  }))

  const heldDeviceIds = new Set(devices.filter(d => d.holder_patient_id && myPatientIds.has(d.holder_patient_id)).map(d => d.device_id))
  const myDevices = devices.filter(d => heldDeviceIds.has(d.device_id))

  if (loading) return <div className="loading-box">กำลังโหลด...</div>

  return (
    <>
      <TopHeader
        title={`สวัสดี, ${firstName}`}
        breadcrumb={['หน้าแรก', 'ภาพรวมการฝึก']}
        user={user}
        action={{ label: 'เคสของฉัน', onClick: () => onOpenCases?.() }}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <SummaryCard icon={Users} label="ผู้ป่วยในความดูแล" value={myPatients.length} tone="blue" />
        <SummaryCard icon={UserCheck} label="ฝึกใน 7 วันล่าสุด" value={activePatientIds.size} tone="green" />
        <SummaryCard icon={CalendarCheck2} label="เซสชันวันนี้" value={todaySessions.length || todayAppts.length} tone="cyan" />
        <SummaryCard icon={AlertTriangle} label="ต้องติดตาม" value={needsAttention.length} tone="red" />
        <SummaryCard icon={Cpu} label="อุปกรณ์ที่ผู้ป่วยถือ" value={myDevices.length} tone="purple" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-[#cfe4e0] bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-dash-text">ภาพรวมความก้าวหน้าของผู้ป่วย</h2>
            <span className="text-[11px] text-dash-text-soft">ครั้งฝึกสะสม 14 วันล่าสุด</span>
          </div>
          <LineChart data={chartData} color="#0d9488" />
        </div>

        <div className="rounded-2xl border border-[#cfe4e0] bg-white p-5">
          <h2 className="mb-3 text-[14px] font-bold text-dash-text">ผู้ป่วยที่ต้องติดตาม</h2>
          <div className="space-y-2">
            {needsAttention.length === 0 && <p className="text-[12px] text-dash-text-soft">ยังไม่มีผู้ป่วยที่ต้องติดตามเป็นพิเศษ</p>}
            {needsAttention.map(({ patient, daysSince }) => (
              <AttentionPatientCard
                key={patient.patient_id}
                name={patientName(patient)}
                stage={patient.current_stage}
                status={patient.status === 'IN_PROGRESS' ? 'อยู่ระหว่างลงทะเบียน' : 'กำลังฝึก'}
                lastExercise={daysSince === null ? 'ยังไม่เคยฝึก' : `${daysSince} วันที่แล้ว`}
                alert={daysSince === null || daysSince >= 7 ? 'ไม่มีการฝึกเกิน 7 วัน' : null}
                onClick={onOpenCases}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#cfe4e0] bg-white p-5">
        <h2 className="mb-3 text-[14px] font-bold text-dash-text">เซสชันการฟื้นฟูวันนี้</h2>
        <div className="space-y-2.5">
          {todaySessions.length === 0 && <p className="text-[12px] text-dash-text-soft">ยังไม่มีการบันทึกเซสชันฝึกวันนี้</p>}
          {todaySessions.map(s => {
            const p = findPatient(s.patient_id)
            const device = devices.find(d => d.holder_patient_id === s.patient_id)
            return (
              <SessionRow
                key={s.session_id}
                patientName={patientName(p)}
                programName={s.program_name}
                durationSec={s.duration_sec}
                reps={s.total_reps}
                rangeOfMotion={s.movement_count ? Number(s.movement_count) * 0.35 : null}
                deviceStatus={device?.status ?? 'ACTIVE'}
                status={s.status}
              />
            )
          })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AppointmentCalendar events={calendarEvents} />

        <div className="rounded-2xl border border-[#cfe4e0] bg-white p-5">
          <h2 className="mb-3 text-[14px] font-bold text-dash-text">สถานะอุปกรณ์ของผู้ป่วยในความดูแล</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {myDevices.length === 0 && <p className="text-[12px] text-dash-text-soft">ยังไม่มีอุปกรณ์ที่ผู้ป่วยของคุณถือครองอยู่</p>}
            {myDevices.map(d => <DeviceStatusCard key={d.device_id} device={d} />)}
          </div>
        </div>
      </div>
    </>
  )
}

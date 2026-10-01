import { useEffect, useState } from 'react'
import type { Patient, PatientAppointment, Device, TherapySession, PatientProgram, SessionFeedback, PageKey } from '../../types'
import { PlayCircle, Wifi, WifiOff, Battery, CalendarDays, MessageSquare, Flame, Star, CheckCircle2 } from 'lucide-react'
import { API_BASE } from '../../config'

interface Props { patientId: string; onNavigate: (p: PageKey) => void }

const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
const STEP_LABEL: Record<number, string> = { 1: 'รับเรื่อง + ลงทะเบียน', 2: 'โปรแกรมฝึก + จับคู่อุปกรณ์', 3: 'นัดตรวจเช็คอุปกรณ์' }

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

function calcStreak(sessions: TherapySession[]): number {
  const days = new Set(sessions.map(s => dayKey(new Date(s.session_date))))
  const cursor = new Date()
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(dayKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1) }
  return streak
}

function daysTrainedLast7(sessions: TherapySession[]): number {
  const days = new Set(sessions.map(s => dayKey(new Date(s.session_date))))
  let n = 0
  const cursor = new Date()
  for (let i = 0; i < 7; i++) { if (days.has(dayKey(cursor))) n++; cursor.setDate(cursor.getDate() - 1) }
  return n
}

function Ring({ r, stroke, pct, color, animate }: { r: number; stroke: number; pct: number; color: string; animate: boolean }) {
  const c = 2 * Math.PI * r
  return (
    <>
      <circle cx="75" cy="75" r={r} fill="none" stroke="#EFEDF7" strokeWidth={stroke} />
      <circle
        cx="75" cy="75" r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={animate ? c * (1 - Math.min(1, pct)) : c}
        style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)' }}
      />
    </>
  )
}

export default function PatientHomePage({ patientId, onNavigate }: Props) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appts, setAppts] = useState<PatientAppointment[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [program, setProgram] = useState<PatientProgram | null>(null)
  const [feedback, setFeedback] = useState<SessionFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [animate, setAnimate] = useState(false)

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

  useEffect(() => {
    if (loading) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
    return () => cancelAnimationFrame(id)
  }, [loading])

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

  const todayKey = dayKey(now)
  const setsToday = sessions.filter(s => dayKey(new Date(s.session_date)) === todayKey).length
  const totalSets = program?.session_per_day ?? 0
  const todayPct = totalSets > 0 ? Math.min(1, setsToday / totalSets) : 0
  const streak = calcStreak(sessions)
  const weekDays = daysTrainedLast7(sessions)
  const weekPct = weekDays / 7
  const completedAppts = appts.filter(a => a.status === 'COMPLETED').length
  const doneToday = totalSets > 0 && setsToday >= totalSets

  const badges = [
    { label: 'ฝึกครบ 3 วันติด', on: streak >= 3 },
    { label: 'สะสม 1,000 ครั้ง', on: totalReps >= 1000 },
    { label: 'ฝึกครบ 7 วันติด', on: streak >= 7 },
    { label: 'ไม่ขาดนัด 5 ครั้ง', on: completedAppts >= 5 },
  ]

  return (
    <div className="space-y-3.5">
      <div className="px-0.5 pt-1.5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[16px] font-bold text-[#1B1E2C]">สวัสดี, {name.split(' ')[0]}</div>
            <div className="mt-px text-[10.5px] text-[#82869C]">รหัสผู้ป่วย: {patient.patient_id}</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[#FFF3DC] px-2.5 py-1.5 text-[11px] font-bold text-[#C9820E]">
            <Flame size={13} fill="currentColor" /> {streak} วันติด
          </div>
        </div>

        {patient.status !== 'COMPLETED' && (
          <div className="mt-2 inline-flex items-center rounded-full bg-[#F1ECFC] px-2.5 py-1 text-[10.5px] font-semibold text-[#7350C7]">
            อยู่ระหว่าง: {STEP_LABEL[patient.registration_step ?? 1] ?? '—'}
          </div>
        )}

        <div className="relative mx-auto my-3 h-[150px] w-[150px]">
          <svg viewBox="0 0 150 150" className="h-[150px] w-[150px] -rotate-90">
            <Ring r={64} stroke={11} pct={todayPct} color="#E5533A" animate={animate} />
            <Ring r={46} stroke={11} pct={weekPct} color="#7350C7" animate={animate} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-mono text-[25px] font-bold leading-none text-[#1B1E2C]">{Math.round(todayPct * 100)}%</div>
            <div className="mt-[3px] text-[9px] font-semibold tracking-wide text-[#82869C]">เป้าหมายวันนี้</div>
          </div>
        </div>
        <div className="flex justify-center gap-4 text-[9.5px] font-semibold text-[#62677D]">
          <span className="flex items-center gap-1.5"><i className="h-[7px] w-[7px] rounded-full bg-[#E5533A]" />ครั้งฝึกวันนี้</span>
          <span className="flex items-center gap-1.5"><i className="h-[7px] w-[7px] rounded-full bg-[#7350C7]" />ความสม่ำเสมอ {weekDays}/7 วัน</span>
        </div>
      </div>

      <div className="pg-card p-4">
        <div className="mb-1.5 text-[11px] font-bold text-[#62677D]">โปรแกรมฝึกวันนี้</div>
        {program ? (
          <>
            <div className="text-[14.5px] font-bold text-[#1B1E2C]">{program.program_name}</div>
            <div className="mt-1 text-[11px] leading-relaxed text-[#82869C]">
              เป้าหมาย {program.repeat_count} ครั้ง/เซต · {program.session_per_day} เซต/วัน · {Math.round(program.duration_sec / 60)} นาที/ครั้ง
            </div>
            <div className="mt-3.5 flex gap-1">
              {Array.from({ length: Math.max(1, totalSets) }).map((_, i) => (
                <div key={i} className={`h-[9px] flex-1 rounded-full ${i < setsToday ? 'pg-seg-filled' : 'bg-[#EFEDF7]'}`} />
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[10.5px] font-semibold text-[#82869C]">
              <span>ทำแล้ว {Math.min(setsToday, totalSets)}/{totalSets} เซตวันนี้</span>
              <span>{Math.round(todayPct * 100)}%</span>
            </div>
          </>
        ) : (
          <div className="text-[12px] text-[#82869C]">ยังไม่ได้รับมอบหมายโปรแกรมการฝึก</div>
        )}
        <button
          onClick={() => onNavigate('patient-stats')}
          className={`mt-3.5 flex w-full items-center justify-center gap-2 rounded-[14px] py-3 text-[13.5px] font-extrabold transition active:scale-[.97] ${
            doneToday
              ? 'bg-gradient-to-br from-[#1E9E6B] to-[#0F7A56] text-white shadow-[0_10px_22px_rgba(30,158,107,.24)]'
              : 'bg-gradient-to-br from-[#E5533A] to-[#C9820E] text-[#3A1706] shadow-[0_10px_22px_rgba(229,83,58,.24)]'
          }`}
        >
          {doneToday ? <><CheckCircle2 size={17} /> เยี่ยมมาก! ฝึกครบวันนี้แล้ว</> : <><PlayCircle size={17} /> เริ่มโปรแกรมฝึกวันนี้</>}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="pg-card p-3.5">
          {connected ? <Wifi size={16} className="text-[#1E9E6B]" /> : <WifiOff size={16} className="text-[#82869C]" />}
          <div className={`mt-2 text-[13px] font-bold ${connected ? 'text-[#1E9E6B]' : 'text-[#82869C]'}`}>{connected ? 'เชื่อมต่อแล้ว' : 'ยังไม่เชื่อมต่อ'}</div>
          <div className="mt-[3px] flex items-center gap-1 text-[10.5px] text-[#82869C]">
            {myDevice ? <><Battery size={11} /> {myDevice.battery_level != null ? `แบตเตอรี่ ${myDevice.battery_level}%` : 'อุปกรณ์ ' + myDevice.device_id}</> : 'ยังไม่มีอุปกรณ์'}
          </div>
        </div>
        <button onClick={() => onNavigate('patient-appointments')} className="pg-card p-3.5 text-left">
          <CalendarDays size={16} className="text-[#0E7C93]" />
          <div className="mt-2 text-[13px] font-bold leading-snug text-[#0E7C93]">{nextAppt ? fmt(nextAppt.appointment_date) : 'ยังไม่มีนัด'}</div>
          <div className="mt-[3px] text-[10.5px] text-[#82869C]">
            นัดหมายครั้งถัดไป{nextAppt?.therapist_name ? ` · กภ.${nextAppt.therapist_name}` : ''}
          </div>
        </button>
      </div>

      <div className="pg-card p-4">
        <div className="mb-2.5 text-[11px] font-bold text-[#62677D]">เหรียญความสำเร็จ</div>
        <div className="flex gap-2">
          {badges.map(b => (
            <div
              key={b.label}
              className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl border px-1 py-2.5 ${
                b.on ? 'border-[#C9820E]/30 bg-[#FFF3DC]' : 'border-white/80 bg-white/55'
              }`}
            >
              <Star size={19} fill="currentColor" className={b.on ? 'text-[#C9820E]' : 'text-[#82869C] opacity-50'} />
              <span className={`text-center text-[8.5px] font-semibold leading-tight ${b.on ? 'text-[#1B1E2C]' : 'text-[#82869C]'}`}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {latestFeedback && (
        <button onClick={() => onNavigate('patient-feedback')} className="pg-card flex w-full items-center gap-3 p-3.5 text-left">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#F1ECFC] text-[#7350C7]">
            <MessageSquare size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] text-[#82869C]">คำแนะนำล่าสุดจาก กภ.{latestFeedback.therapist_name ?? ''}</div>
            <div className="mt-0.5 line-clamp-2 text-[12px] text-[#62677D]">{latestFeedback.comment}</div>
          </div>
        </button>
      )}
    </div>
  )
}

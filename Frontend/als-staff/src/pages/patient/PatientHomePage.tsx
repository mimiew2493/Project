import { useEffect, useState } from 'react'
import type { Patient, PatientAppointment, Device, TherapySession, PatientProgram, PageKey } from '../../types'
import { PlayCircle, Wifi, WifiOff, CalendarDays, Flame, Check, CheckCircle2 } from 'lucide-react'
import { API_BASE } from '../../config'
import { ProgressRing, SetSegments } from './patientUi'
import { dayKey, fmtClock, sessionsOnDay } from './patientUtils'

interface Props { patientId: string; onNavigate: (p: PageKey) => void }

const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

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

export default function PatientHomePage({ patientId, onNavigate }: Props) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [appts, setAppts] = useState<PatientAppointment[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [program, setProgram] = useState<PatientProgram | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/patients?status=ALL`).then(r => r.json()),
      fetch(`${API_BASE}/api/appointments?patient_id=${patientId}`).then(r => r.json()),
      fetch(`${API_BASE}/api/devices`).then(r => r.json()),
      fetch(`${API_BASE}/api/sessions?patient_id=${patientId}`).then(r => r.json()),
      fetch(`${API_BASE}/api/patient-programs?patient_id=${patientId}`).then(r => r.json()),
    ])
      .then(([p, a, d, s, pp]) => {
        if (Array.isArray(p)) setPatient(p.find((x: Patient) => x.patient_id === patientId) ?? null)
        if (Array.isArray(a)) setAppts(a)
        if (Array.isArray(d)) setDevices(d)
        if (Array.isArray(s)) setSessions(s)
        if (Array.isArray(pp)) setProgram(pp.find((x: PatientProgram) => x.status === 'ACTIVE') ?? pp[0] ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [patientId])

  if (loading) return <div className="py-16 text-center text-[13px] text-[#625E70]">กำลังโหลด...</div>
  if (!patient) return <div className="py-16 text-center text-[14px] font-semibold text-[#1F1D2B]">ไม่พบข้อมูลผู้ป่วย</div>

  const now = new Date()
  const nextAppt = appts.filter(a => new Date(a.appointment_date) >= now && a.status === 'SCHEDULED')
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0]
  const myDevice = devices.find(d => d.holder_patient_id === patientId)
  const connected = myDevice?.connection_status === 'CONNECTED'
  const firstName = (patient.first_name ?? '').trim() || patient.patient_id

  const today = sessionsOnDay(sessions, now)
  const totalSets = program?.session_per_day ?? 0
  const targetReps = program?.repeat_count ?? 0
  const setsToday = today.length
  const repsToday = today.reduce((s, x) => s + x.total_reps, 0)
  const repsGoal = targetReps * totalSets
  const todayPct = repsGoal > 0 ? Math.min(1, repsToday / repsGoal) : 0
  const setPct = totalSets > 0 ? Math.min(1, setsToday / totalSets) : 0
  const doneToday = totalSets > 0 && setsToday >= totalSets
  const streak = calcStreak(sessions)
  const weekDays = daysTrainedLast7(sessions)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-[21px] font-bold">สวัสดี, {firstName}</span>
          <span className="text-[12px] text-[#625E70]">รหัสผู้ป่วย: {patient.patient_id}</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-[#FFF0D9] px-3 py-1.5 text-[13px] font-semibold text-[#8C420A]">
          <Flame size={14} /> {streak} วันติด
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <ProgressRing size={150} stroke={12} pct={todayPct}>
          <span className="text-[30px] font-bold leading-tight">{Math.round(todayPct * 100)}%</span>
          <span className="text-[11px] text-[#625E70]">เป้าหมายวันนี้</span>
        </ProgressRing>
        <div className="flex gap-4 text-[12px] text-[#625E70]">
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#C4501A]" />ครั้งฝึกวันนี้ {repsToday}/{repsGoal}</span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#6D4BC2]" />ความสม่ำเสมอ {weekDays}/7 วัน</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 rounded-[18px] bg-white p-4 shadow-[0_1px_3px_rgba(31,29,43,0.06)]">
        {program ? (
          <>
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] text-[#625E70]">โปรแกรมฝึกวันนี้</span>
              <span className="text-[17px] font-bold">{program.program_name}</span>
              <span className="text-[12px] text-[#625E70]">
                เป้าหมาย {targetReps} ครั้ง/เซต · {totalSets} เซต/วัน · {Math.round(program.duration_sec / 60)} นาที/ครั้ง
              </span>
            </div>
            <SetSegments done={setsToday} total={totalSets} />
            <div className="flex justify-between text-[12px] text-[#625E70]">
              <span>ทำแล้ว {Math.min(setsToday, totalSets)}/{totalSets} เซตวันนี้</span>
              <span>{Math.round(setPct * 100)}%</span>
            </div>
            {today.map((s, i) => (
              <div key={s.session_id} className="flex items-center gap-2 rounded-[10px] bg-[#F7F5FB] px-3 py-2 text-[13px]">
                {s.total_reps >= targetReps
                  ? <Check size={16} strokeWidth={2.4} className="text-[#1F9D5C]" />
                  : <span className="h-4 w-4 rounded-full border-2 border-[#E0A458]" />}
                <span>เซต {i + 1}: <span className="font-semibold">{s.total_reps}/{targetReps} ครั้ง</span> · {fmtClock(s.session_date)}</span>
              </div>
            ))}
            {doneToday ? (
              <button
                onClick={() => onNavigate('patient-stats')}
                className="flex h-[50px] items-center justify-center gap-2 rounded-[14px] bg-[#1F9D5C] text-[16px] font-semibold text-white"
              >
                <CheckCircle2 size={18} /> ฝึกครบวันนี้แล้ว · ดูผลการฝึก
              </button>
            ) : (
              <button
                onClick={() => onNavigate('patient-train')}
                className="flex h-[50px] items-center justify-center gap-2 rounded-[14px] bg-[#C4501A] text-[16px] font-semibold text-white transition active:scale-[.98]"
              >
                <PlayCircle size={18} /> เริ่มเซตที่ {setsToday + 1}
              </button>
            )}
          </>
        ) : (
          <>
            <span className="text-[12px] text-[#625E70]">โปรแกรมฝึกวันนี้</span>
            <span className="text-[14px] text-[#625E70]">ยังไม่ได้รับมอบหมายโปรแกรมการฝึก กรุณาติดต่อนักกายภาพ</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1 rounded-2xl bg-white px-3.5 py-3">
          {connected ? <Wifi size={18} className="text-[#1F9D5C]" /> : <WifiOff size={18} className="text-[#625E70]" />}
          <span className={`text-[14px] font-semibold ${connected ? 'text-[#145C38]' : 'text-[#625E70]'}`}>{connected ? 'เชื่อมต่อแล้ว' : 'ยังไม่เชื่อมต่อ'}</span>
          <span className="text-[12px] text-[#625E70]">
            {myDevice
              ? `${myDevice.device_name || myDevice.device_id}${myDevice.battery_level != null ? ` · แบต ${myDevice.battery_level}%` : ''}`
              : 'ยังไม่มีอุปกรณ์'}
          </span>
        </div>
        <button onClick={() => onNavigate('patient-appointments')} className="flex flex-col gap-1 rounded-2xl bg-white px-3.5 py-3 text-left">
          <CalendarDays size={18} className="text-[#2A6F97]" />
          <span className="text-[14px] font-semibold leading-snug text-[#1F5573]">{nextAppt ? fmt(nextAppt.appointment_date) : 'ยังไม่มีนัด'}</span>
          <span className="text-[12px] text-[#625E70]">
            {nextAppt ? `นัดถัดไป${nextAppt.therapist_name ? ` · กภ.${nextAppt.therapist_name}` : ''}` : 'นัดถัดไปจะแสดงที่นี่'}
          </span>
        </button>
      </div>
    </div>
  )
}

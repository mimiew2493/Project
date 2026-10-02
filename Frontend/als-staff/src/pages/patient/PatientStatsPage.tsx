import { useEffect, useState } from 'react'
import type { TherapySession, PatientProgram } from '../../types'
import { API_BASE } from '../../config'
import { dayKey, fmtClock, fmtDuration, sessionsOnDay } from './patientUtils'

interface Props { patientId: string }

const WEEKDAY_MON_FIRST = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา']
const MAX_DAY_GROUPS = 7

const fmtShortDate = (d: Date) => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
const fmtDayLabel = (d: Date) => d.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })

/** วันจันทร์ของสัปดาห์ที่มีวันนี้อยู่ */
function startOfWeek(d: Date): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  s.setDate(s.getDate() - ((s.getDay() + 6) % 7))
  return s
}

export default function PatientStatsPage({ patientId }: Props) {
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [program, setProgram] = useState<PatientProgram | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/sessions?patient_id=${patientId}`).then(r => r.json()),
      fetch(`${API_BASE}/api/patient-programs?patient_id=${patientId}`).then(r => r.json()),
    ])
      .then(([s, pp]) => {
        if (Array.isArray(s)) setSessions(s)
        if (Array.isArray(pp)) setProgram(pp.find((x: PatientProgram) => x.status === 'ACTIVE') ?? pp[0] ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [patientId])

  if (loading) return <div className="py-16 text-center text-[13px] text-[#625E70]">กำลังโหลด...</div>

  const now = new Date()
  const weekStart = startOfWeek(now)
  const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d })
  const weekEnd = weekDays[6]
  const perDay = weekDays.map(d => sessionsOnDay(sessions, d).reduce((s, x) => s + x.total_reps, 0))
  const weekSessions = weekDays.flatMap(d => sessionsOnDay(sessions, d))
  const weekReps = perDay.reduce((a, b) => a + b, 0)
  const maxReps = Math.max(1, ...perDay)
  const todayIdx = (now.getDay() + 6) % 7

  // จัดกลุ่มตามวัน (ใหม่ → เก่า) แล้วใส่ลำดับเซตภายในวัน
  const groups = new Map<string, { date: Date; items: TherapySession[] }>()
  for (const s of [...sessions].sort((a, b) => b.session_date.localeCompare(a.session_date))) {
    const d = new Date(s.session_date)
    const k = dayKey(d)
    if (!groups.has(k)) {
      if (groups.size >= MAX_DAY_GROUPS) break
      groups.set(k, { date: d, items: [] })
    }
    groups.get(k)!.items.push(s)
  }
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
  const targetFor = (s: TherapySession) => (program && s.program_id === program.program_id ? program.repeat_count : null)

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-col">
        <span className="text-[21px] font-bold">ผลการฝึก</span>
        <span className="text-[13px] text-[#625E70]">สัปดาห์นี้ · {fmtShortDate(weekStart)} – {fmtShortDate(weekEnd)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-0.5 rounded-2xl bg-white px-3.5 py-3">
          <span className="text-[12px] text-[#625E70]">จำนวนครั้งรวม</span>
          <span className="text-[22px] font-bold">{weekReps.toLocaleString()} ครั้ง</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-2xl bg-white px-3.5 py-3">
          <span className="text-[12px] text-[#625E70]">เซตที่ทำ</span>
          <span className="text-[22px] font-bold">{weekSessions.length} เซต</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 rounded-[18px] bg-white p-4">
        <span className="text-[14px] font-semibold">จำนวนครั้งต่อวัน</span>
        <div className="grid h-[110px] grid-cols-7 items-end gap-2 border-b border-[#ECE8F3]">
          {perDay.map((n, i) => (
            i > todayIdx ? <div key={i} /> : (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className={`text-[11px] ${i === todayIdx ? 'font-semibold text-[#1F1D2B]' : 'text-[#625E70]'}`}>{n}</span>
                <div
                  className={`w-full rounded-t-md ${i === todayIdx ? 'bg-[#C4501A]' : 'bg-[#EBC3AE]'}`}
                  style={{ height: n > 0 ? Math.max(4, (n / maxReps) * 88) : 2 }}
                />
              </div>
            )
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-[12px] text-[#625E70]">
          {WEEKDAY_MON_FIRST.map((w, i) => (
            <span key={w} className={i === todayIdx ? 'font-bold text-[#1F1D2B]' : ''}>{w}</span>
          ))}
        </div>
      </div>

      {groups.size === 0 && (
        <div className="rounded-2xl bg-white p-4 text-center text-[13px] text-[#625E70]">ยังไม่มีผลการฝึก เริ่มเซตแรกได้จากหน้าหลัก</div>
      )}

      {[...groups.values()].map(({ date, items }) => {
        const k = dayKey(date)
        const prefix = k === dayKey(now) ? 'วันนี้ · ' : k === dayKey(yesterday) ? 'เมื่อวาน · ' : ''
        return (
          <div key={k} className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-[#625E70]">{prefix}{fmtDayLabel(date)}</span>
            {items.map((s, i) => {
              const target = targetFor(s)
              const complete = target != null ? s.total_reps >= target : s.status === 'COMPLETED'
              return (
                <div key={s.session_id} className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FBE7DC] text-[15px] font-bold text-[#A8430F]">
                    {items.length - i}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[15px] font-semibold">{s.total_reps}{target != null ? `/${target}` : ''} ครั้ง</span>
                    <span className="text-[12px] text-[#625E70]">{fmtDuration(s.duration_sec)} นาที · จบ {fmtClock(s.session_date)}</span>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${complete ? 'bg-[#E4F5EC] text-[#145C38]' : 'bg-[#FFF0D9] text-[#8C420A]'}`}>
                    {complete ? 'ครบ' : 'หยุดก่อน'}
                  </span>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

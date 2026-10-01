import { useEffect, useState } from 'react'
import type { TherapySession, SessionFeedback, PatientProgram } from '../types'
import MiniBarChart from './MiniBarChart'
import { TrendingUpIcon, MessageIcon } from './Icon'
import { API_BASE } from '../config'

interface Props {
  patientId: string
  /** ซ่อนการ์ด "โปรแกรมการฝึกปัจจุบัน" เมื่อหน้าที่เรียกใช้แสดงข้อมูลนี้ไปแล้ว */
  hideProgram?: boolean
  /** 'patient' = สไตล์การ์ดกระจกสำหรับแอปมือถือฝั่งผู้ป่วย */
  variant?: 'default' | 'patient'
}

const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

const SESSION_STATUS: Record<string, { label: string; cls: string }> = {
  COMPLETED: { label: 'เสร็จสิ้น', cls: 'bg-[#E6F7EF] text-[#1E9E6B]' },
  IN_PROGRESS: { label: 'กำลังฝึก', cls: 'bg-[#E3F3F6] text-[#0E7C93]' },
  SCHEDULED: { label: 'รอเริ่ม', cls: 'bg-[#EFEDF7] text-[#62677D]' },
  CANCELLED: { label: 'ยกเลิก', cls: 'bg-[#FBE9EE] text-[#C43D5C]' },
}
const WEEKDAY = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

/**
 * ประวัติการรักษาแบบรวมศูนย์ — ใช้ซ้ำได้ทั้งฝั่งเวชระเบียน, นักกายภาพ และผู้ป่วยเอง
 * รวมเซสชันการฝึกจากอุปกรณ์ IoT เข้ากับคำแนะนำของนักกายภาพในเส้นเวลาเดียว
 * แทนที่การกระจายอยู่คนละหน้า/คนละการ์ดแบบเดิม
 */
export default function TreatmentHistory({ patientId, hideProgram, variant = 'default' }: Props) {
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [feedback, setFeedback] = useState<SessionFeedback[]>([])
  const [program, setProgram] = useState<PatientProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (loading) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
    return () => cancelAnimationFrame(id)
  }, [loading])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE}/api/sessions?patient_id=${patientId}`).then(r => r.json()),
      fetch(`${API_BASE}/api/feedback?patient_id=${patientId}`).then(r => r.json()),
      fetch(`${API_BASE}/api/patient-programs?patient_id=${patientId}`).then(r => r.json()),
    ])
      .then(([s, f, pp]) => {
        if (Array.isArray(s)) setSessions(s)
        if (Array.isArray(f)) setFeedback(f)
        if (Array.isArray(pp)) setProgram(pp.find((x: PatientProgram) => x.status === 'ACTIVE') ?? pp[0] ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [patientId])

  if (loading) return <div style={{ fontSize: 12, color: 'var(--muted)', padding: '12px 0' }}>กำลังโหลดประวัติการรักษา...</div>

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const totalReps = sessions.reduce((s, x) => s + x.total_reps, 0)
  const weekReps = sessions.filter(s => new Date(s.session_date) >= weekAgo).reduce((s, x) => s + x.total_reps, 0)
  const monthReps = sessions.filter(s => new Date(s.session_date) >= monthAgo).reduce((s, x) => s + x.total_reps, 0)

  const feedbackBySession = new Map<string, SessionFeedback[]>()
  feedback.forEach(f => {
    const arr = feedbackBySession.get(f.session_id) ?? []
    arr.push(f)
    feedbackBySession.set(f.session_id, arr)
  })

  if (variant === 'patient') {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      const key = dayKey(d)
      const reps = sessions.filter(s => dayKey(new Date(s.session_date)) === key).reduce((s, x) => s + x.total_reps, 0)
      return { label: WEEKDAY[d.getDay()], reps, isToday: i === 6 }
    })
    const maxReps = Math.max(...days.map(d => d.reps), 1)
    const peakReps = Math.max(...days.map(d => d.reps))

    if (sessions.length === 0 && feedback.length === 0) {
      return (
        <div className="pg-card px-5 py-9 text-center">
          <div className="text-[13px] font-bold text-[#1B1E2C]">ยังไม่มีประวัติการรักษา</div>
          <div className="mt-1 text-[11.5px] text-[#82869C]">ประวัติจะปรากฏที่นี่เมื่อมีการบันทึกเซสชันการฝึกหรือคำแนะนำจากนักกายภาพ</div>
        </div>
      )
    }

    return (
      <div className="space-y-3.5">
        <div className="pg-card p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <div className="text-[11px] font-bold text-[#62677D]">ครั้งฝึกสะสม 7 วันล่าสุด</div>
            <div className="font-mono text-[15px] font-bold text-[#1B1E2C]">
              {weekReps.toLocaleString('th-TH')} <span className="font-sans text-[10px] font-semibold text-[#82869C]">ครั้ง</span>
            </div>
          </div>
          <div className="flex h-[88px] items-end gap-[7px] pt-5">
            {days.map((d, i) => {
              const isPeak = peakReps > 0 && d.reps === peakReps
              return (
                <div key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                  <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-[#1B1E2C] px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {d.reps.toLocaleString('th-TH')} ครั้ง{d.isToday ? ' (วันนี้)' : ''}
                  </div>
                  {isPeak && <span className="absolute -top-[2px] font-mono text-[9px] font-bold text-[#C9820E]">{d.reps}</span>}
                  <div
                    className={`w-full rounded-t-[5px] rounded-b-[2px] bg-[#E5533A] transition-[height,opacity] duration-700 ease-out group-hover:opacity-100 ${
                      isPeak || d.isToday ? 'opacity-100' : 'opacity-45'
                    } ${d.isToday ? 'shadow-[inset_0_0_0_2px_#C9820E]' : ''}`}
                    style={{ height: animate ? `${d.reps > 0 ? Math.max(6, (d.reps / maxReps) * 100) : 3}%` : '0%' }}
                  />
                  <div className="mt-1.5 text-[9px] font-semibold text-[#82869C]">{d.label}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[['รวมทั้งหมด', totalReps], ['7 วันล่าสุด', weekReps], ['30 วันล่าสุด', monthReps]].map(([label, val]) => (
            <div key={label} className="pg-card px-3 py-3">
              <div className="text-[10px] font-semibold text-[#82869C]">{label}</div>
              <div className="mt-1 font-mono text-[18px] font-bold leading-none text-[#1B1E2C]">{Number(val).toLocaleString('th-TH')}</div>
              <div className="mt-0.5 text-[9.5px] text-[#82869C]">ครั้ง</div>
            </div>
          ))}
        </div>

        <div className="pg-card p-4">
          <div className="mb-1 text-[11px] font-bold text-[#62677D]">ประวัติการรักษา</div>
          {sessions.map(s => {
            const st = SESSION_STATUS[s.status] ?? { label: s.status, cls: 'bg-[#EFEDF7] text-[#62677D]' }
            return (
              <div key={s.session_id} className="border-b border-[#1B1E2C]/[.06] py-2.5 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[12.5px] font-bold text-[#1B1E2C]">{fmt(s.session_date)}</div>
                  <span className={`shrink-0 rounded-full px-2.5 py-[3px] text-[10.5px] font-bold ${st.cls}`}>{st.label}</span>
                </div>
                <div className="mt-0.5 text-[11px] leading-relaxed text-[#82869C]">
                  {s.program_name} · {s.total_reps} ครั้ง · {Math.round(s.duration_sec / 60)} นาที
                  {s.movement_count ? ` · การเคลื่อนไหวจากอุปกรณ์ ${s.movement_count} ครั้ง` : ''}
                </div>
                {(feedbackBySession.get(s.session_id) ?? []).map(f => (
                  <div key={f.feedback_id} className="mt-2 flex items-start gap-2 rounded-xl bg-[#F1ECFC] px-2.5 py-2">
                    <MessageIcon size={13} style={{ marginTop: 2, flexShrink: 0, color: '#7350C7' }} />
                    <div className="min-w-0">
                      <div className="text-[10.5px] text-[#82869C]">
                        คำแนะนำจาก กภ.{f.therapist_name ? ` ${f.therapist_name} ${f.therapist_lastname ?? ''}` : ''}
                      </div>
                      <div className="mt-0.5 text-[12px] text-[#1B1E2C]">{f.comment}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (sessions.length === 0 && feedback.length === 0) {
    return (
      <div className="empty-box" style={{ padding: '36px 20px' }}>
        <div className="empty-icon"><TrendingUpIcon size={40} /></div>
        <div className="empty-title" style={{ fontSize: 13 }}>ยังไม่มีประวัติการรักษา</div>
        <div className="empty-sub">ประวัติจะปรากฏที่นี่เมื่อมีการบันทึกเซสชันการฝึกหรือคำแนะนำจากนักกายภาพ</div>
      </div>
    )
  }

  return (
    <div>
      {!hideProgram && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="eyebrow">โปรแกรมการฝึกปัจจุบัน</div>
          {program ? (
            <>
              <b style={{ fontSize: 14 }}>{program.program_name}</b>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 3 }}>
                เป้าหมาย {program.repeat_count} ครั้ง/เซต · {program.session_per_day} เซต/วัน · {Math.round(program.duration_sec / 60)} นาที/ครั้ง
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>ยังไม่ได้รับมอบหมายโปรแกรมการฝึก</div>
          )}
        </div>
      )}

      <div className="grid3" style={{ marginBottom: 12 }}>
        <div className="card" style={{ padding: '10px 12px' }}>
          <div className="eyebrow">รวมทั้งหมด</div>
          <div className="big" style={{ fontSize: 20 }}>{totalReps}<span className="big-unit">ครั้ง</span></div>
        </div>
        <div className="card" style={{ padding: '10px 12px' }}>
          <div className="eyebrow">7 วันล่าสุด</div>
          <div className="big" style={{ fontSize: 20 }}>{weekReps}<span className="big-unit">ครั้ง</span></div>
        </div>
        <div className="card" style={{ padding: '10px 12px' }}>
          <div className="eyebrow">30 วันล่าสุด</div>
          <div className="big" style={{ fontSize: 20 }}>{monthReps}<span className="big-unit">ครั้ง</span></div>
        </div>
      </div>

      {sessions.length > 0 && (
        <MiniBarChart
          values={[...sessions].reverse().map(s => s.total_reps)}
          labels={[...sessions].reverse().map(s => new Date(s.session_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }))}
        />
      )}

      <div className="eyebrow" style={{ margin: '16px 0 8px' }}>เส้นเวลาการรักษา</div>
      <div className="stack">
        {sessions.map(s => (
          <div key={s.session_id} className="kv" style={{ display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
              <b>{fmt(s.session_date)}</b>
              <span className="pill">{s.status}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
              {s.program_name} · {s.total_reps} ครั้ง · {Math.round(s.duration_sec / 60)} นาที
              {s.movement_count ? ` · การเคลื่อนไหวจากอุปกรณ์ ${s.movement_count} ครั้ง` : ''}
            </div>
            {(feedbackBySession.get(s.session_id) ?? []).map(f => (
              <div key={f.feedback_id} style={{
                marginTop: 8, background: 'var(--blue-t)', border: '1px solid #9fd6cd',
                borderRadius: 10, padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <MessageIcon size={13} style={{ marginTop: 2, flexShrink: 0, color: 'var(--blue)' }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>
                    คำแนะนำจาก กภ.{f.therapist_name ? ` ${f.therapist_name} ${f.therapist_lastname ?? ''}` : ''}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>{f.comment}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

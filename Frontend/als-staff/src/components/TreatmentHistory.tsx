import { useEffect, useState } from 'react'
import type { TherapySession, SessionFeedback, PatientProgram } from '../types'
import MiniBarChart from './MiniBarChart'
import { TrendingUpIcon, MessageIcon } from './Icon'
import { API_BASE } from '../config'

interface Props {
  patientId: string
  /** ซ่อนการ์ด "โปรแกรมการฝึกปัจจุบัน" เมื่อหน้าที่เรียกใช้แสดงข้อมูลนี้ไปแล้ว */
  hideProgram?: boolean
}

const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

/**
 * ประวัติการรักษาแบบรวมศูนย์ — ใช้ซ้ำได้ทั้งฝั่งเวชระเบียน, นักกายภาพ และผู้ป่วยเอง
 * รวมเซสชันการฝึกจากอุปกรณ์ IoT เข้ากับคำแนะนำของนักกายภาพในเส้นเวลาเดียว
 * แทนที่การกระจายอยู่คนละหน้า/คนละการ์ดแบบเดิม
 */
export default function TreatmentHistory({ patientId, hideProgram }: Props) {
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [feedback, setFeedback] = useState<SessionFeedback[]>([])
  const [program, setProgram] = useState<PatientProgram | null>(null)
  const [loading, setLoading] = useState(true)

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

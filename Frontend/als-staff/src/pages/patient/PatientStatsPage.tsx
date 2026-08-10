import { useEffect, useState } from 'react'
import type { TherapySession, PatientProgram } from '../../types'
import SessionHistoryList from '../../components/SessionHistoryList'
import { TrendingUpIcon } from '../../components/Icon'
import { API_BASE } from '../../config'

interface Props { patientId: string }

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

  if (loading) return <div className="loading-box">กำลังโหลด...</div>

  const totalReps = sessions.reduce((s, x) => s + x.total_reps, 0)

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700 }}>ผลการฝึก</h1>
        <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>สรุปข้อมูลจากอุปกรณ์ IoT ระหว่างการฝึก</p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
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

      <div className="grid2" style={{ marginBottom: 14 }}>
        <div className="card"><div className="eyebrow">จำนวนครั้งสะสม</div><div className="big">{totalReps}<span className="big-unit">ครั้ง</span></div></div>
        <div className="card"><div className="eyebrow">จำนวนเซสชัน</div><div className="big">{sessions.length}<span className="big-unit">ครั้ง</span></div></div>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon"><TrendingUpIcon size={48} /></div>
          <div className="empty-title">ยังไม่มีข้อมูลการฝึก</div>
          <div className="empty-sub">ข้อมูลจะปรากฏที่นี่เมื่อมีการบันทึกเซสชันการฝึกจากอุปกรณ์เข้าระบบ</div>
        </div>
      ) : (
        <div className="card">
          <SessionHistoryList sessions={sessions} />
        </div>
      )}
    </>
  )
}

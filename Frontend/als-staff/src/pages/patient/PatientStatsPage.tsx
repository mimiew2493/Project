import { useEffect, useState } from 'react'

interface Props { patientId: string }

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

const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

export default function PatientStatsPage({ patientId }: Props) {
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`http://localhost:3000/api/sessions?patient_id=${patientId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setSessions(d) })
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

      <div className="grid2" style={{ marginBottom: 14 }}>
        <div className="card"><div className="eyebrow">จำนวนครั้งสะสม</div><div className="big">{totalReps}<span className="big-unit">ครั้ง</span></div></div>
        <div className="card"><div className="eyebrow">จำนวนเซสชัน</div><div className="big">{sessions.length}<span className="big-unit">ครั้ง</span></div></div>
      </div>

      {sessions.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon">📈</div>
          <div className="empty-title">ยังไม่มีข้อมูลการฝึก</div>
          <div className="empty-sub">ข้อมูลจะปรากฏที่นี่เมื่อมีการบันทึกเซสชันการฝึกจากอุปกรณ์เข้าระบบ</div>
        </div>
      ) : (
        <div className="stack">
          {sessions.map(s => (
            <div key={s.session_id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <b style={{ fontSize: 13 }}>{fmt(s.session_date)}</b>
                <span className="pill">{s.status}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
                {s.program_name} · {s.total_reps} ครั้ง · {Math.round(s.duration_sec / 60)} นาที
                {s.movement_count ? ` · การเคลื่อนไหวจากอุปกรณ์ ${s.movement_count} ครั้ง` : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

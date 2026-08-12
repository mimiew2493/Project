import type { TherapySession } from '../types'
import MiniBarChart from './MiniBarChart'

interface Props { sessions: TherapySession[]; loading?: boolean; renderExtra?: (s: TherapySession) => React.ReactNode }

const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

export default function SessionHistoryList({ sessions, loading, renderExtra }: Props) {
  if (loading) return <div style={{ fontSize: 12, color: 'var(--muted)' }}>กำลังโหลด...</div>

  if (sessions.length === 0) {
    return <div className="note">ยังไม่มีข้อมูลการฝึกบันทึกไว้สำหรับผู้ป่วยคนนี้</div>
  }

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const totalReps = sessions.reduce((s, x) => s + x.total_reps, 0)
  const weekReps = sessions.filter(s => new Date(s.session_date) >= weekAgo).reduce((s, x) => s + x.total_reps, 0)
  const monthReps = sessions.filter(s => new Date(s.session_date) >= monthAgo).reduce((s, x) => s + x.total_reps, 0)

  return (
    <>
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
      <MiniBarChart
        values={[...sessions].reverse().map(s => s.total_reps)}
        labels={[...sessions].reverse().map(s => new Date(s.session_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }))}
      />
      <div className="stack" style={{ marginTop: 12 }}>
        {sessions.map(s => (
          <div key={s.session_id} className="kv" style={{ display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <b>{fmt(s.session_date)}</b>
              <span className="pill">{s.status}</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
              {s.program_name} · {s.total_reps} ครั้ง · {Math.round(s.duration_sec / 60)} นาที
              {s.movement_count ? ` · การเคลื่อนไหวจากอุปกรณ์ ${s.movement_count} ครั้ง` : ''}
            </div>
            {renderExtra?.(s)}
          </div>
        ))}
      </div>
    </>
  )
}

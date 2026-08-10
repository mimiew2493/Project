import type { TherapySession } from '../types'
import MiniBarChart from './MiniBarChart'

interface Props { sessions: TherapySession[]; loading?: boolean; renderExtra?: (s: TherapySession) => React.ReactNode }

const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

export default function SessionHistoryList({ sessions, loading, renderExtra }: Props) {
  if (loading) return <div style={{ fontSize: 12, color: 'var(--muted)' }}>กำลังโหลด...</div>

  if (sessions.length === 0) {
    return <div className="note">ยังไม่มีข้อมูลการฝึกบันทึกไว้สำหรับผู้ป่วยคนนี้</div>
  }

  return (
    <>
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

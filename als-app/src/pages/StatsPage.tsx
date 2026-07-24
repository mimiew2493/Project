import { useState } from 'react'
import { sessions } from '../data/mockData'

type PeriodKey = 'week' | 'month' | 'all'
const pd: Record<PeriodKey, { sessions: number; reps: number; speed: number; adherence: number }> = {
  week:  { sessions: 4,  reps: 167,  speed: 3.75, adherence: 80 },
  month: { sessions: 16, reps: 680,  speed: 3.72, adherence: 85 },
  all:   { sessions: 32, reps: 1360, speed: 3.7,  adherence: 82 },
}

export default function StatsPage(): JSX.Element {
  const [period, setPeriod] = useState<PeriodKey>('week')
  const d = pd[period]
  const cards = [
    { value: d.sessions, label: 'จำนวน Session', color: 'var(--cyan)' },
    { value: d.reps, label: 'รวมรอบ', color: 'var(--lime)' },
    { value: d.speed, label: 'ความเร็วเฉลี่ย (r/s)', color: 'var(--amber)' },
    { value: `${d.adherence}%`, label: 'ปฏิบัติตามแผน', color: 'var(--violet)' },
  ]
  return (
    <>
      <div className="topbar"><div className="topbar-greeting">📊 สถิติการออกกำลังกาย</div><div className="topbar-sub">ดูแนวโน้มและความก้าวหน้าของคุณ</div></div>
      <div className="content">
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['week', 'month', 'all'] as PeriodKey[]).map((k) => (
            <button key={k} onClick={() => setPeriod(k)} style={{ padding: '8px 20px', border: '1px solid var(--line)', background: period === k ? 'var(--cyan)' : 'transparent', color: period === k ? '#06222a' : 'var(--dim)', borderRadius: 8, cursor: 'pointer', fontWeight: period === k ? 600 : 400, fontFamily: '"IBM Plex Mono", monospace', fontSize: 12 }}>
              {k === 'week' ? 'สัปดาห์นี้' : k === 'month' ? 'เดือนนี้' : 'ทั้งหมด'}
            </button>
          ))}
        </div>
        <div className="stats-row">
          {cards.map((s, i) => (<div key={i} className="stat-card"><div className="stat-value" style={{ color: s.color }}>{s.value}</div><div className="stat-label">{s.label}</div></div>))}
        </div>
        <div className="card">
          <div className="eyebrow">session history</div><h3>ประวัติ Session ทั้งหมด</h3>
          {sessions.map((s) => (
            <div key={s.id} className="session-row">
              <div className="session-dot" style={{ background: s.done ? 'var(--lime)' : 'var(--amber)' }} />
              <div className="session-info"><div className="session-name">{s.name}</div><div className="session-date">{s.date}</div></div>
              <div className="session-metrics"><span><strong>{s.reps}</strong> reps</span><span><strong>{s.speed}</strong> r/s</span></div>
              <span className={`badge ${s.done ? 'badge-done' : 'badge-incomplete'}`}>{s.done ? 'เสร็จ' : 'ไม่ครบ'}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

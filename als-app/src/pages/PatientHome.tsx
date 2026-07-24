import { patient, program, stats, weekDays, sessions, feedbacks } from '../data/mockData'
import type { StatItem } from '../data/types'

export default function PatientHome(): JSX.Element {
  const statCards: { data: StatItem; label: string; color: string }[] = [
    { data: stats.latestReps, label: 'รอบล่าสุด',      color: 'var(--cyan)' },
    { data: stats.avgSpeed,   label: 'ความเร็วเฉลี่ย',  color: 'var(--lime)' },
    { data: stats.adherence,  label: 'ปฏิบัติตามแผน',   color: 'var(--amber)' },
    { data: stats.weekCount,  label: 'ครั้งสัปดาห์นี้',  color: 'var(--violet)' },
  ]
  return (
    <>
      <div className="topbar">
        <div className="topbar-greeting">สวัสดี, <span>{patient.name}</span> 👋</div>
        <div className="topbar-sub">patient-id: {patient.id} · วันนี้เป็นวันที่ดีในการฝึก</div>
      </div>
      <div className="content">
        <div className="stats-row">
          {statCards.map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-value" style={{ color: s.color }}>{s.data.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className={`stat-trend ${s.data.up ? 'trend-up' : 'trend-down'}`}>{s.data.trend}</div>
            </div>
          ))}
        </div>
        <div className="two-col">
          <div>
            <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: 'radial-gradient(circle at top right, var(--cyan-dim), transparent 70%)', pointerEvents: 'none' }} />
              <div className="eyebrow">current program</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--cyan)', marginBottom: 4 }}>{program.name}</div>
              <div style={{ fontSize: 13, color: 'var(--dim)', marginBottom: 16 }}>{program.desc}</div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${program.progress}%` }} /></div>
              <div className="progress-meta"><span>วันที่ {program.currentDay} ของ {program.totalDays}</span><span>สิ้นสุด {program.endDate}</span></div>
            </div>
            <div className="card">
              <div className="eyebrow">this week</div>
              <h3>ปฏิทินสัปดาห์</h3>
              <div className="week-strip">
                {weekDays.map((d, i) => (
                  <div key={i} className={`week-day ${d.done ? 'done' : ''} ${d.today ? 'today' : ''}`}>
                    <div className="week-day-label">{d.label}</div>
                    <div className="week-day-num">{d.done ? '✓' : d.num}</div>
                    <div className="week-day-status">{d.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="card">
              <div className="eyebrow">recent sessions</div>
              <h3>ประวัติการออกกำลัง</h3>
              {sessions.map((s) => (
                <div key={s.id} className="session-row">
                  <div className="session-dot" style={{ background: s.done ? 'var(--lime)' : 'var(--amber)' }} />
                  <div className="session-info"><div className="session-name">{s.name}</div><div className="session-date">{s.date}</div></div>
                  <div className="session-metrics"><span><strong>{s.reps}</strong> reps</span><span><strong>{s.speed}</strong> r/s</span></div>
                  <span className={`badge ${s.done ? 'badge-done' : 'badge-incomplete'}`}>{s.done ? 'เสร็จ' : 'ไม่ครบ'}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="eyebrow">therapist feedback</div>
              <h3>ความคิดเห็นจากหมอ</h3>
              {feedbacks.map((f) => (
                <div key={f.id} className="feedback-item">
                  <div className="feedback-avatar">{f.initials}</div>
                  <div><div className="feedback-from">{f.from} <span>{f.date}</span></div><div className="feedback-msg">{f.msg}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="cta-section"><button className="cta-btn">▶ เริ่มออกกำลังกาย</button></div>
    </>
  )
}

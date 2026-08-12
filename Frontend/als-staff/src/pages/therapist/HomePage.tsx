import { useEffect, useMemo, useState } from 'react'
import type { TherapySession, Patient } from '../../types'
import MiniBarChart from '../../components/MiniBarChart'
import { TrendingUpIcon, UserMdIcon, BarChartIcon } from '../../components/Icon'
import { API_BASE } from '../../config'

interface Props { otId: string; firstName: string }

type Granularity = 'day' | 'week' | 'total'

const toLocalYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const startOfWeek = (base: Date) => {
  const d = new Date(base)
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function HomePage({ otId, firstName }: Props) {
  const [sessions, setSessions] = useState<TherapySession[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [granularity, setGranularity] = useState<Granularity>('day')

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/sessions?ot_id=${otId}`).then(r => r.json()),
      fetch(`${API_BASE}/api/patients?status=ALL`).then(r => r.json()),
    ])
      .then(([s, p]) => {
        if (Array.isArray(s)) setSessions(s)
        if (Array.isArray(p)) setPatients(p)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [otId])

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const totalReps = sessions.reduce((s, x) => s + x.total_reps, 0)
  const weekReps = sessions.filter(s => new Date(s.session_date) >= weekAgo).reduce((s, x) => s + x.total_reps, 0)
  const activePatients = new Set(sessions.map(s => s.patient_id).filter(Boolean)).size
  const patientName = (id?: string) => {
    const p = patients.find(x => x.patient_id === id)
    return p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || id : id
  }

  const chart = useMemo(() => {
    if (granularity === 'day') {
      const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(now)
        d.setDate(d.getDate() - (13 - i))
        return d
      })
      const byDay = new Map<string, number>()
      sessions.forEach(s => {
        const key = toLocalYMD(new Date(s.session_date))
        byDay.set(key, (byDay.get(key) ?? 0) + s.total_reps)
      })
      return {
        values: days.map(d => byDay.get(toLocalYMD(d)) ?? 0),
        labels: days.map(d => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })),
      }
    }
    if (granularity === 'week') {
      const weeks = Array.from({ length: 8 }, (_, i) => {
        const d = startOfWeek(now)
        d.setDate(d.getDate() - (7 - i) * 7)
        return d
      })
      const byWeek = new Map<string, number>()
      sessions.forEach(s => {
        const key = toLocalYMD(startOfWeek(new Date(s.session_date)))
        byWeek.set(key, (byWeek.get(key) ?? 0) + s.total_reps)
      })
      return {
        values: weeks.map(d => byWeek.get(toLocalYMD(d)) ?? 0),
        labels: weeks.map(d => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })),
      }
    }
    const byPatient = new Map<string, number>()
    sessions.forEach(s => {
      if (!s.patient_id) return
      byPatient.set(s.patient_id, (byPatient.get(s.patient_id) ?? 0) + s.total_reps)
    })
    const entries = Array.from(byPatient.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
    return {
      values: entries.map(([, v]) => v),
      labels: entries.map(([id]) => (patientName(id) ?? id ?? '').slice(0, 8)),
    }
  }, [sessions, granularity])

  if (loading) return <div className="loading-box">กำลังโหลด...</div>

  return (
    <>
      <div className="h-sec">
        <div>
          <h1 className="page-title">สวัสดี, {firstName}</h1>
          <p className="page-sub">ภาพรวมผลงานการฝึกที่คุณดูแล</p>
        </div>
      </div>

      <div className="grid3">
        <div className="card">
          <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><UserMdIcon size={13} /> ผู้ป่วยที่มีข้อมูลฝึก</div>
          <div className="big">{activePatients}<span className="big-unit">คน</span></div>
        </div>
        <div className="card" style={{ background: 'var(--blue-t)', borderColor: '#d5e2f7' }}>
          <div className="eyebrow" style={{ color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUpIcon size={13} /> ครั้งฝึกสะสมทั้งหมด</div>
          <div className="big" style={{ color: 'var(--blue)' }}>{totalReps}<span className="big-unit">ครั้ง</span></div>
        </div>
        <div className="card" style={{ background: 'var(--green-t)', borderColor: '#d9e9d4' }}>
          <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BarChartIcon size={13} /> 7 วันล่าสุด</div>
          <div className="big" style={{ color: 'var(--green)' }}>{weekReps}<span className="big-unit">ครั้ง</span></div>
        </div>
      </div>

      <div className="card">
        <div className="h-sec">
          <span className="h-sec-title">กราฟผลการฝึกที่คุณบันทึก</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`filter-pill ${granularity === 'day' ? 'active' : ''}`} onClick={() => setGranularity('day')}>รายวัน</button>
            <button className={`filter-pill ${granularity === 'week' ? 'active' : ''}`} onClick={() => setGranularity('week')}>รายสัปดาห์</button>
            <button className={`filter-pill ${granularity === 'total' ? 'active' : ''}`} onClick={() => setGranularity('total')}>รวมตามผู้ป่วย</button>
          </div>
        </div>
        {sessions.length === 0 ? (
          <div className="note">ยังไม่มีข้อมูลการฝึกที่บันทึกไว้ — เริ่มบันทึกได้จากหน้า "เคสของฉัน"</div>
        ) : (
          <MiniBarChart values={chart.values} labels={chart.labels} height={140} />
        )}
      </div>
    </>
  )
}

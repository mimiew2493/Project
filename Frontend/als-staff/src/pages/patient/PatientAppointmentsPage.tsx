import { useEffect, useState } from 'react'
import type { PatientAppointment } from '../../types'
import SideBadge from '../../components/SideBadge'
import { CalendarIcon, ToolIcon } from '../../components/Icon'
import { API_BASE } from '../../config'

interface Props { patientId: string }

const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

export default function PatientAppointmentsPage({ patientId }: Props) {
  const [appts, setAppts] = useState<PatientAppointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/api/appointments?patient_id=${patientId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAppts(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [patientId])

  if (loading) return <div className="loading-box">กำลังโหลด...</div>

  const sorted = [...appts].sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700 }}>นัดหมายของฉัน</h1>
        <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>ประวัตินัดหมายทั้งหมด {sorted.length} ครั้ง</p>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon"><CalendarIcon size={48} /></div>
          <div className="empty-title">ยังไม่มีนัดหมาย</div>
        </div>
      ) : (
        <div className="stack">
          {sorted.map(a => (
            <div key={a.appointment_id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <b style={{ fontSize: 13 }}>{fmt(a.appointment_date)}</b>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
                    {a.therapist_name ? `กภ. ${a.therapist_name}` : 'ยังไม่มอบหมายนักกายภาพ'} · {a.duration_min} นาที
                  </div>
                </div>
                <span className={`pill ${a.status === 'SCHEDULED' ? 'pill-amber' : a.status === 'COMPLETED' ? 'pill-green' : ''}`}>{a.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <SideBadge side={a.treated_side ?? a.affected_side} />
                {a.device_id && <span style={{ fontSize: 10.5, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><ToolIcon size={11} /> {a.device_id}</span>}
              </div>
              {a.note && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>{a.note}</div>}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

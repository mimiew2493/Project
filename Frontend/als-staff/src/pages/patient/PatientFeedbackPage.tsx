import { useEffect, useState } from 'react'
import type { SessionFeedback } from '../../types'
import { MessageIcon } from '../../components/Icon'
import { API_BASE } from '../../config'

interface Props { patientId: string }

const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

export default function PatientFeedbackPage({ patientId }: Props) {
  const [items, setItems] = useState<SessionFeedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE}/api/feedback?patient_id=${patientId}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setItems(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [patientId])

  if (loading) return <div className="loading-box">กำลังโหลด...</div>

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700 }}>คำแนะนำจากนักกายภาพ</h1>
        <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>ข้อเสนอแนะเกี่ยวกับการฝึกของคุณ</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-box">
          <div className="empty-icon"><MessageIcon size={48} /></div>
          <div className="empty-title">ยังไม่มีคำแนะนำ</div>
          <div className="empty-sub">คำแนะนำจากนักกายภาพบำบัดของคุณจะปรากฏที่นี่</div>
        </div>
      ) : (
        <div className="stack">
          {items.map(f => (
            <div key={f.feedback_id} className="card" style={{ background: 'var(--blue-t)', borderColor: '#d5e2f7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <b style={{ fontSize: 12.5 }}>{f.therapist_name ? `กภ. ${f.therapist_name} ${f.therapist_lastname ?? ''}` : 'นักกายภาพบำบัด'}</b>
                <span style={{ fontSize: 10.5, color: 'var(--muted)' }}>{fmt(f.created_at)}</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{f.comment}</div>
              <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 6 }}>สำหรับเซสชันวันที่ {fmt(f.session_date)}</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

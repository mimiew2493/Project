import { useEffect, useState } from 'react'
import type { SessionFeedback } from '../../types'
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

  if (loading) return <div className="py-16 text-center text-[12px] text-[#82869C]">กำลังโหลด...</div>

  return (
    <div className="space-y-3">
      <div className="px-0.5">
        <h1 className="text-[15px] font-extrabold text-[#1B1E2C]">คำแนะนำจากนักกายภาพ</h1>
        <p className="mt-[3px] text-[11px] text-[#82869C]">ข้อเสนอแนะเกี่ยวกับการฝึกของคุณ</p>
      </div>

      {items.length === 0 ? (
        <div className="pg-card px-5 py-10 text-center">
          <div className="text-[13px] font-bold text-[#1B1E2C]">ยังไม่มีคำแนะนำ</div>
          <div className="mt-1 text-[11.5px] text-[#82869C]">คำแนะนำจากนักกายภาพบำบัดของคุณจะปรากฏที่นี่</div>
        </div>
      ) : (
        items.map(f => (
          <div key={f.feedback_id} className="pg-card p-4">
            <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-[#82869C]">
              <span className="font-bold text-[#1B1E2C]">{f.therapist_name ? `กภ.${f.therapist_name} ${f.therapist_lastname ?? ''}` : 'นักกายภาพบำบัด'}</span>
              <span>{fmt(f.created_at)}</span>
            </div>
            <div className="text-[12.5px] leading-relaxed text-[#1B1E2C]">{f.comment}</div>
            <div className="mt-2 text-[10.5px] text-[#82869C]">สำหรับเซสชันวันที่ {fmt(f.session_date)}</div>
          </div>
        ))
      )}
    </div>
  )
}

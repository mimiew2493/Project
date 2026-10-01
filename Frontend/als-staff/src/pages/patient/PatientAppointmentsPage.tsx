import { useEffect, useState } from 'react'
import type { PatientAppointment } from '../../types'
import { Wrench } from 'lucide-react'
import { API_BASE } from '../../config'

interface Props { patientId: string }

const fmt = (iso: string) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

const STATUS: Record<string, { label: string; cls: string }> = {
  SCHEDULED: { label: 'ยืนยันแล้ว', cls: 'bg-[#E6F7EF] text-[#1E9E6B]' },
  PROPOSED: { label: 'รอยืนยัน', cls: 'bg-[#FFF3DC] text-[#C9820E]' },
  COMPLETED: { label: 'เสร็จสิ้น', cls: 'bg-[#EFEDF7] text-[#62677D]' },
  CANCELLED: { label: 'ยกเลิก', cls: 'bg-[#FBE9EE] text-[#C43D5C]' },
  NO_SHOW: { label: 'ไม่มาตามนัด', cls: 'bg-[#FBE9EE] text-[#C43D5C]' },
}

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

  if (loading) return <div className="py-16 text-center text-[12px] text-[#82869C]">กำลังโหลด...</div>

  const sorted = [...appts].sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))

  return (
    <div className="space-y-3">
      <div className="px-0.5">
        <h1 className="text-[15px] font-extrabold text-[#1B1E2C]">นัดหมายของฉัน</h1>
        <p className="mt-[3px] text-[11px] text-[#82869C]">ประวัตินัดหมายทั้งหมด {sorted.length} ครั้ง</p>
      </div>

      {sorted.length === 0 ? (
        <div className="pg-card px-5 py-10 text-center text-[13px] font-bold text-[#1B1E2C]">ยังไม่มีนัดหมาย</div>
      ) : (
        sorted.map(a => {
          const st = STATUS[a.status] ?? { label: a.status, cls: 'bg-[#EFEDF7] text-[#62677D]' }
          const side = a.treated_side ?? a.affected_side
          return (
            <div key={a.appointment_id} className="pg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-mono text-[13px] font-bold text-[#1B1E2C]">{fmt(a.appointment_date)}</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-[#82869C]">
                    {a.therapist_name ? `กภ.${a.therapist_name}` : 'ยังไม่มอบหมายนักกายภาพ'} · {a.duration_min} นาที
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-[3px] text-[10.5px] font-bold ${st.cls}`}>{st.label}</span>
              </div>
              {(side || a.device_id) && (
                <div className="mt-2 flex items-center gap-2">
                  {side && <span className="rounded-full bg-[#F1ECFC] px-2 py-[3px] text-[9.5px] font-bold text-[#7350C7]">{side}</span>}
                  {a.device_id && (
                    <span className="inline-flex items-center gap-1 text-[10.5px] text-[#82869C]"><Wrench size={11} /> {a.device_id}</span>
                  )}
                </div>
              )}
              {a.note && <div className="mt-1.5 text-[11px] text-[#82869C]">{a.note}</div>}
            </div>
          )
        })
      )}
    </div>
  )
}

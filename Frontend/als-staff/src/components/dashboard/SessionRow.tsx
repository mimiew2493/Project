import { Clock, Repeat, Move, Cpu, CheckCircle2, Circle, XCircle } from 'lucide-react'

export interface SessionRowData {
  patientName: string
  programName: string
  durationSec: number
  reps: number
  rangeOfMotion?: number | null
  deviceStatus: 'ACTIVE' | 'MAINTENANCE' | string
  status: 'COMPLETED' | 'SCHEDULED' | 'IN_PROGRESS' | string
}

const STATUS_MAP: Record<string, { label: string; icon: typeof CheckCircle2; tone: string }> = {
  COMPLETED: { label: 'เสร็จสิ้น', icon: CheckCircle2, tone: 'text-[#3fae7d] bg-[#eafaf2]' },
  IN_PROGRESS: { label: 'กำลังฝึก', icon: Circle, tone: 'text-dash-primary bg-dash-primary-light' },
  SCHEDULED: { label: 'รอเริ่ม', icon: Circle, tone: 'text-[#e69a3e] bg-[#fff5e9]' },
  CANCELLED: { label: 'ยกเลิก', icon: XCircle, tone: 'text-dash-red bg-[#ffeff1]' },
}

export default function SessionRow({ patientName, programName, durationSec, reps, rangeOfMotion, deviceStatus, status }: SessionRowData) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.SCHEDULED
  const StatusIcon = s.icon
  const minutes = Math.round(durationSec / 60)
  const deviceOk = deviceStatus === 'ACTIVE'

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#cfe4e0] bg-white p-4">
      <div className="min-w-[140px] flex-1">
        <div className="text-[13px] font-semibold text-dash-text">{patientName}</div>
        <div className="text-[11px] text-dash-text-soft">{programName}</div>
      </div>

      <div className="flex items-center gap-1.5 text-[11.5px] text-dash-text-soft"><Clock size={13} /> {minutes} นาที</div>
      <div className="flex items-center gap-1.5 text-[11.5px] text-dash-text-soft"><Repeat size={13} /> {reps} ครั้ง</div>
      {rangeOfMotion != null && (
        <div className="flex items-center gap-1.5 text-[11.5px] text-dash-text-soft"><Move size={13} /> {rangeOfMotion.toFixed(1)} ซม.</div>
      )}
      <div className={`flex items-center gap-1.5 text-[11.5px] ${deviceOk ? 'text-[#3fae7d]' : 'text-dash-orange'}`}>
        <Cpu size={13} /> {deviceOk ? 'อุปกรณ์พร้อม' : 'ซ่อมบำรุง'}
      </div>

      <span className={`ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${s.tone}`}>
        <StatusIcon size={12} /> {s.label}
      </span>
    </div>
  )
}

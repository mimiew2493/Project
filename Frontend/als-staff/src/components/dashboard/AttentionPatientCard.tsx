import { AlertTriangle } from 'lucide-react'
import type { DiseaseStage } from '../../types'
import { STAGE_LABEL } from '../../pages/shared/ProgramLibraryPage'

const STAGE_TONE: Record<DiseaseStage, string> = {
  FLACCID: 'bg-[#ffeff1] text-[#f0596c]',
  SPASTIC: 'bg-[#fff5e9] text-[#e69a3e]',
  RECOVERY: 'bg-[#eafaf2] text-[#3fae7d]',
}

const AV_COLORS = ['#0d9488', '#14b8a6', '#72D6A3', '#A98FF3', '#FFB86B', '#FF7A8A']
const colorFor = (seed: string) => AV_COLORS[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_COLORS.length]

interface Props {
  name: string
  stage?: DiseaseStage | null
  status: string
  lastExercise: string
  alert?: string | null
  onClick?: () => void
}

export default function AttentionPatientCard({ name, stage, status, lastExercise, alert, onClick }: Props) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase() || '?'

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-[#cfe4e0] bg-white p-3.5 text-left transition hover:border-dash-primary/40 hover:shadow-sm"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white"
        style={{ backgroundColor: colorFor(name) }}
      >
        {initials}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold text-dash-text">{name}</span>
          {alert && <AlertTriangle size={13} className="shrink-0 text-dash-red" />}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {stage && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STAGE_TONE[stage]}`}>{STAGE_LABEL[stage]}</span>}
          <span className="text-[10.5px] text-dash-text-soft">{status}</span>
        </div>
        <div className="mt-1 truncate text-[10.5px] text-dash-text-soft">ฝึกล่าสุด: {lastExercise}</div>
      </div>
    </button>
  )
}

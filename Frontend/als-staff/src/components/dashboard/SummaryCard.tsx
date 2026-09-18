import type { ComponentType } from 'react'
import { ArrowUpRight, ArrowDownRight, type LucideProps } from 'lucide-react'

export type CardTone = 'blue' | 'cyan' | 'green' | 'purple' | 'orange' | 'red'

const TONE_BG: Record<CardTone, string> = {
  blue: 'bg-dash-primary-light text-dash-primary',
  cyan: 'bg-[#eafbfd] text-[#2fb9cf]',
  green: 'bg-[#eafaf2] text-[#3fae7d]',
  purple: 'bg-[#f4f0fe] text-[#8a6ce8]',
  orange: 'bg-[#fff5e9] text-[#e69a3e]',
  red: 'bg-[#ffeff1] text-[#f0596c]',
}

interface Props {
  icon: ComponentType<LucideProps>
  label: string
  value: string | number
  unit?: string
  tone?: CardTone
  trend?: { value: number; positive: boolean; label?: string; suffix?: string }
}

export default function SummaryCard({ icon: Icon, label, value, unit, tone = 'blue', trend }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#cfe4e0] bg-white p-5 shadow-[0_2px_10px_rgba(13,148,136,0.06)]">
      <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-dash-bg" />
      <div className={`relative flex h-9 w-9 items-center justify-center rounded-xl ${TONE_BG[tone]}`}>
        <Icon size={17} strokeWidth={2.2} />
      </div>
      <div className="relative mt-3.5 text-[11px] font-semibold uppercase tracking-wide text-dash-text-soft">{label}</div>
      <div className="relative mt-1 flex items-baseline gap-1">
        <span className="mono text-[24px] font-bold leading-none text-dash-text">{value}</span>
        {unit && <span className="text-[11.5px] text-dash-text-soft">{unit}</span>}
      </div>
      {trend && (
        <div className={`relative mt-2 flex items-center gap-1 text-[11px] font-medium ${trend.positive ? 'text-[#3fae7d]' : 'text-[#f0596c]'}`}>
          {trend.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend.value)}{trend.suffix ?? '%'} {trend.label ?? ''}
        </div>
      )}
    </div>
  )
}

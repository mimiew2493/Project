import { useId, useState } from 'react'

interface Point { label: string; value: number }
interface Props { data: Point[]; color?: string; height?: number }

export default function LineChart({ data, color = '#0d9488', height = 220 }: Props) {
  const gradientId = useId()
  const [hover, setHover] = useState<number | null>(null)

  if (data.length === 0) {
    return <div className="flex h-full items-center justify-center text-[12px] text-dash-text-soft" style={{ height }}>ยังไม่มีข้อมูล</div>
  }

  const W = 600
  const H = height
  const padX = 12
  const padTop = 14
  const padBottom = 26
  const max = Math.max(1, ...data.map(d => d.value))
  const min = 0
  const stepX = data.length > 1 ? (W - padX * 2) / (data.length - 1) : 0
  const yFor = (v: number) => padTop + (1 - (v - min) / (max - min || 1)) * (H - padTop - padBottom)
  const xFor = (i: number) => padX + i * stepX

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(d.value)}`).join(' ')
  const areaPath = `${linePath} L ${xFor(data.length - 1)} ${H - padBottom} L ${xFor(0)} ${H - padBottom} Z`

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1={padX} x2={W - padX} y1={padTop + f * (H - padTop - padBottom)} y2={padTop + f * (H - padTop - padBottom)} stroke="#e3f4f1" strokeWidth={1} />
        ))}

        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={xFor(i)} cy={yFor(d.value)} r={hover === i ? 5 : 3.5}
              fill="#fff" stroke={color} strokeWidth={2}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
            <rect x={xFor(i) - stepX / 2} y={0} width={Math.max(stepX, 1)} height={H} fill="transparent"
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
          </g>
        ))}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-dash-text px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg"
          style={{ left: `${(xFor(hover) / W) * 100}%`, top: `${(yFor(data[hover].value) / H) * 100 - 4}%` }}
        >
          {data[hover].label}: <b>{data[hover].value}</b>
        </div>
      )}

      <div className="mt-1 flex justify-between px-1 text-[10px] text-dash-text-soft">
        {data.map((d, i) => (
          <span key={i} className={data.length > 10 && i % Math.ceil(data.length / 8) !== 0 ? 'opacity-0' : ''}>{d.label}</span>
        ))}
      </div>
    </div>
  )
}

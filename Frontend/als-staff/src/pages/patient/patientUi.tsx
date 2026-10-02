import type { ReactNode } from 'react'

export function ProgressRing({ size, stroke, pct, children }: { size: number; stroke: number; pct: number; children: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ECE8F3" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#C4501A" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, pct)))}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.22,1,.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

/** วงกลมเลขครั้ง 1..target — ถ้าเป้าหมายเยอะเกินจะแสดงเป็นแถบแทน */
export function RepDots({ done, target }: { done: number; target: number }) {
  if (target <= 0) return null
  if (target > 12) {
    return (
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F1EDF6]">
        <div className="h-full rounded-full bg-[#C4501A] transition-[width]" style={{ width: `${Math.min(100, (done / target) * 100)}%` }} />
      </div>
    )
  }
  return (
    <div className="flex gap-[5px]">
      {Array.from({ length: target }, (_, i) => {
        const n = i + 1
        const cls = n <= done
          ? 'bg-[#C4501A] font-semibold text-white'
          : n === done + 1
            ? 'border-2 border-[#C4501A] font-semibold text-[#A8430F]'
            : 'bg-[#F1EDF6] text-[#625E70]'
        return <span key={n} className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${cls}`}>{n}</span>
      })}
    </div>
  )
}

export function SetSegments({ done, total }: { done: number; total: number }) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.max(1, total)}, minmax(0, 1fr))` }}>
      {Array.from({ length: Math.max(1, total) }, (_, i) => (
        <div key={i} className={`h-2 rounded-full ${i < done ? 'bg-[#C4501A]' : 'bg-[#ECE8F3]'}`} />
      ))}
    </div>
  )
}

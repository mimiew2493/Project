interface Props { values: number[]; labels: string[]; color?: string; height?: number }

export default function MiniBarChart({ values, labels, color = 'var(--blue)', height = 110 }: Props) {
  const w = 100
  const max = Math.max(...values, 1) * 1.15
  const gap = 1.5
  const n = values.length
  const barW = (w - gap * (n - 1)) / n

  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      {values.map((v, i) => {
        const barH = (v / max) * (height - 22)
        const x = i * (barW + gap)
        const y = height - 18 - barH
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={1.5} fill={color} opacity={0.55 + 0.45 * (v / max)} />
            <text x={x + barW / 2} y={height - 6} fontSize={4.5} fill="var(--muted)" textAnchor="middle">{labels[i]}</text>
          </g>
        )
      })}
    </svg>
  )
}

import { useEffect, useRef, useState } from 'react'

interface Props { values: number[]; labels: string[]; color?: string; height?: number }

export default function MiniBarChart({ values, labels, color = 'var(--blue)', height = 110 }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [pinned, setPinned] = useState<number | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => setPinned(null), [values])

  useEffect(() => {
    if (pinned === null) return
    const onOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPinned(null)
    }
    document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [pinned])

  const n = values.length
  if (n === 0) return null

  const max = Math.max(...values, 1)
  const barArea = height - 20
  const labelStep = n <= 8 ? 1 : Math.ceil(n / 6)
  const active = pinned ?? hovered

  return (
    <div ref={rootRef} style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height, paddingTop: 26, borderBottom: '1px solid var(--line)' }}>
        {values.map((v, i) => {
          const barH = v > 0 ? Math.max((v / max) * barArea, 3) : 0
          const isActive = active === i
          return (
            <div key={i} style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
              {isActive && (
                <div role="tooltip" style={{
                  position: 'absolute', bottom: barH + 8, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--ink)', color: '#fff', fontSize: 10.5, fontWeight: 600,
                  padding: '4px 8px', borderRadius: 6, whiteSpace: 'nowrap', zIndex: 2, pointerEvents: 'none',
                  boxShadow: 'var(--sh)',
                }}>
                  {v.toLocaleString('th-TH')} ครั้ง · {labels[i]}
                </div>
              )}
              <button
                type="button"
                aria-label={`${labels[i]}: ${v} ครั้ง`}
                onClick={e => { e.stopPropagation(); setPinned(p => (p === i ? null : i)) }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                style={{
                  width: '100%', maxWidth: 24, height: barH || 1,
                  background: color, opacity: v === 0 ? 0.15 : isActive ? 1 : 0.7,
                  border: 'none', borderRadius: '4px 4px 0 0', cursor: 'pointer', padding: 0,
                  transition: 'opacity .12s',
                }}
              />
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
        {labels.map((l, i) => (
          <div key={i} style={{
            flex: 1, minWidth: 0, textAlign: 'center', fontSize: 9.5, color: 'var(--muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {i === 0 || i === n - 1 || i % labelStep === 0 ? l : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

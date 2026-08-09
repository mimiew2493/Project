export default function SideBadge({ side }: { side?: string | null }) {
  if (!side) return null
  const map: Record<string, { cls: string; pre: string }> = {
    'ข้างซ้าย':     { cls: 'side-badge side-badge-left',  pre: '← ' },
    'ข้างขวา':     { cls: 'side-badge side-badge-right', pre: '→ ' },
    'ทั้งสองข้าง': { cls: 'side-badge side-badge-both',  pre: '↔ ' },
  }
  const s = map[side]
  if (!s) return null
  return <span className={s.cls}>{s.pre}{side}</span>
}

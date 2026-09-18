import type { ReactNode } from 'react'
import { Search, Plus, ChevronRight, ChevronDown } from 'lucide-react'
import type { AuthUser } from '../../types'

interface Props {
  title: string
  breadcrumb: string[]
  user: AuthUser
  search?: string
  onSearchChange?: (v: string) => void
  searchPlaceholder?: string
  action?: { label: string; onClick: () => void; icon?: ReactNode }
  /** ใส่คอนโทรลกำหนดเองแทน action ปุ่มเดียว เช่น ปุ่มเปลี่ยนสัปดาห์/เดือนของตารางนัด */
  right?: ReactNode
}

export default function TopHeader({
  title, breadcrumb, user, search, onSearchChange, searchPlaceholder = 'ค้นหา...',
  action, right,
}: Props) {
  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`

  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#cfe4e0] bg-white/80 px-5 py-4 backdrop-blur-sm">
      <div>
        <div className="flex items-center gap-1.5 text-[11px] text-dash-text-soft">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={11} />}
              {b}
            </span>
          ))}
        </div>
        <h1 className="mt-0.5 text-[19px] font-bold text-dash-text">{title}</h1>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        {onSearchChange && (
          <div className="relative hidden min-w-0 flex-1 sm:block sm:max-w-xl">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dash-text-soft" />
            <input
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-[#cfe4e0] bg-dash-bg py-2 pl-8 pr-3 text-[12.5px] text-dash-text outline-none transition focus:border-dash-primary focus:bg-white"
            />
          </div>
        )}

        <button className="hidden items-center gap-2 rounded-xl px-1.5 py-1 transition hover:bg-dash-bg sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-dash-primary-light text-[11px] font-bold text-dash-primary">
            {initials}
          </div>
          <span className="text-[12.5px] font-semibold text-dash-text">{user.first_name}</span>
          <ChevronDown size={13} className="text-dash-text-soft" />
        </button>

        {right}

        {action && (
          <button
            onClick={action.onClick}
            className="flex items-center gap-1.5 rounded-xl bg-dash-primary px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-md shadow-dash-primary/25 transition hover:brightness-105"
          >
            {action.icon ?? <Plus size={15} />}
            {action.label}
          </button>
        )}
      </div>
    </header>
  )
}

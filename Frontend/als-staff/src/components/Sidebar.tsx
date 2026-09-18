import type { ComponentType } from 'react'
import type { AuthUser, PageKey } from '../types'
import {
  Users, Stethoscope, Cpu, CalendarDays, ClipboardList,
  LayoutDashboard, User, LogOut, Activity, type LucideProps,
} from 'lucide-react'

// 'register' ไม่ได้อยู่ในเมนู — เข้าถึงผ่านปุ่ม "+ รับผู้ป่วยใหม่" ในหน้าคิว/แดชบอร์ดแทน เพื่อไม่ให้เมนูซ้ำซ้อน
const STAFF_NAV: { key: PageKey; label: string; icon: ComponentType<LucideProps> }[] = [
  { key: 'overview',   label: 'แดชบอร์ด',             icon: LayoutDashboard },
  { key: 'queue',      label: 'คิวรับผู้ป่วย',        icon: Users },
  { key: 'therapists', label: 'จัดการนักกายภาพ',      icon: Stethoscope },
  { key: 'devices',    label: 'คลังอุปกรณ์',          icon: Cpu },
  { key: 'schedule',   label: 'ตารางนัดรวม',          icon: CalendarDays },
  { key: 'programs',   label: 'คลังโปรแกรมฝึก',       icon: ClipboardList },
]

const THERAPIST_NAV: { key: PageKey; label: string; icon: ComponentType<LucideProps> }[] = [
  { key: 'my-home',     label: 'หน้าแรก',        icon: LayoutDashboard },
  { key: 'my-cases',    label: 'เคสของฉัน',      icon: Stethoscope },
  { key: 'my-schedule', label: 'ตารางนัดของฉัน',  icon: CalendarDays },
  { key: 'programs',    label: 'คลังโปรแกรมฝึก',  icon: ClipboardList },
  { key: 'my-profile',  label: 'โปรไฟล์ของฉัน',   icon: User },
]

interface Props { page: PageKey; onNavigate: (p: PageKey) => void; user: AuthUser; onLogout: () => void }

export default function Sidebar({ page, onNavigate, user, onLogout }: Props) {
  const nav = user.role_id === 'R002' ? THERAPIST_NAV : STAFF_NAV
  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`

  return (
    <nav className="flex w-[240px] shrink-0 flex-col bg-[linear-gradient(160deg,#0b2e2a,#0f3d37_60%,#0c4a42)]">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-dash-primary to-dash-cyan text-white shadow-sm shadow-dash-primary/30">
          <Activity size={18} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-[14.5px] font-bold text-white">ระบบฟื้นฟู ALS</h2>
          <p className="text-[10.5px] text-white/50">แพลตฟอร์มดูแลผู้ป่วย</p>
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {nav.map(n => {
          const active = page === n.key
          return (
            <button
              key={n.key}
              onClick={() => onNavigate(n.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] transition-colors ${
                active
                  ? 'bg-white/10 font-semibold text-white'
                  : 'text-white/55 hover:bg-white/5 hover:text-white/85'
              }`}
            >
              <n.icon size={17} strokeWidth={active ? 2.4 : 2} className={active ? 'text-dash-cyan' : ''} />
              {n.label}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2.5 border-t border-white/10 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-dash-primary text-[11px] font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-white">{user.first_name} {user.last_name}</div>
          <div className="truncate text-[10.5px] text-white/50">{user.role_name}</div>
        </div>
        <button
          onClick={onLogout}
          title="ออกจากระบบ"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-dash-red/20 hover:text-dash-red"
        >
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  )
}

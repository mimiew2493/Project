import type { ComponentType } from 'react'
import type { AuthUser, PageKey } from '../types'
import { UsersIcon, UserPlusIcon, StethoscopeIcon, BoxIcon, CalendarIcon, BarChartIcon, UserMdIcon, UserIcon, LogOutIcon, type IconProps } from './Icon'

const STAFF_NAV: { key: PageKey; label: string; icon: ComponentType<IconProps> }[] = [
  { key: 'queue',      label: 'คิวรับผู้ป่วย',        icon: UsersIcon },
  { key: 'register',   label: 'ลงทะเบียนผู้ป่วยใหม่', icon: UserPlusIcon },
  { key: 'therapists', label: 'จัดการนักกายภาพ',      icon: StethoscopeIcon },
  { key: 'devices',    label: 'คลังอุปกรณ์',          icon: BoxIcon },
  { key: 'schedule',   label: 'ตารางนัดรวม',          icon: CalendarIcon },
  { key: 'overview',   label: 'ภาพรวมศูนย์',          icon: BarChartIcon },
]

const THERAPIST_NAV: { key: PageKey; label: string; icon: ComponentType<IconProps> }[] = [
  { key: 'my-cases',    label: 'เคสของฉัน',      icon: UserMdIcon },
  { key: 'my-schedule', label: 'ตารางนัดของฉัน',  icon: CalendarIcon },
  { key: 'my-profile',  label: 'โปรไฟล์ของฉัน',   icon: UserIcon },
]

interface Props { page: PageKey; onNavigate: (p: PageKey) => void; user: AuthUser; onLogout: () => void }

export default function Sidebar({ page, onNavigate, user, onLogout }: Props) {
  const nav = user.role_id === 'R002' ? THERAPIST_NAV : STAFF_NAV
  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <h2>ALS Rehab</h2>
        <p>บุคลากร · เวชระเบียน</p>
      </div>
      <div className="sidebar-nav">
        {nav.map(n => (
          <button key={n.key} className={`nav-btn ${page === n.key ? 'active' : ''}`} onClick={() => onNavigate(n.key)}>
            <n.icon size={16} />
            {n.label}
          </button>
        ))}
      </div>
      <div className="sidebar-footer">
        <div className="avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="user-name">{user.first_name} {user.last_name}</div>
          <div className="user-role">{user.role_name}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onLogout} title="ออกจากระบบ"><LogOutIcon size={14} /></button>
      </div>
    </nav>
  )
}

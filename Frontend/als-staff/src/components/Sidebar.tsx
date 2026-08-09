import type { AuthUser, PageKey } from '../types'

const STAFF_NAV: { key: PageKey; label: string; icon: string }[] = [
  { key: 'queue',      label: 'คิวรับผู้ป่วย',        icon: '👥' },
  { key: 'register',   label: 'ลงทะเบียนผู้ป่วยใหม่', icon: '➕' },
  { key: 'therapists', label: 'จัดการนักกายภาพ',      icon: '🩺' },
  { key: 'devices',    label: 'คลังอุปกรณ์',          icon: '📦' },
  { key: 'schedule',   label: 'ตารางนัดรวม',          icon: '📅' },
  { key: 'overview',   label: 'ภาพรวมศูนย์',          icon: '📊' },
]

const THERAPIST_NAV: { key: PageKey; label: string; icon: string }[] = [
  { key: 'my-cases',    label: 'เคสของฉัน',      icon: '🧑‍⚕️' },
  { key: 'my-schedule', label: 'ตารางนัดของฉัน',  icon: '📅' },
  { key: 'my-profile',  label: 'โปรไฟล์ของฉัน',   icon: '👤' },
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
            <span style={{ fontSize: 16 }}>{n.icon}</span>
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
        <button className="btn btn-ghost btn-sm" onClick={onLogout} title="ออกจากระบบ">ออก</button>
      </div>
    </nav>
  )
}

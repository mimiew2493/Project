import { CalendarIcon, ChartIcon, DeviceIcon, PlusUserIcon, UsersIcon } from './Icons'

export type PageKey = 'patients' | 'register' | 'devices' | 'schedule' | 'overview'

const items = [
  { key: 'patients' as const, label: 'คิวรับผู้ป่วย', icon: UsersIcon },
  { key: 'register' as const, label: 'ลงทะเบียนผู้ป่วยใหม่', icon: PlusUserIcon },
  { key: 'devices' as const, label: 'คลังอุปกรณ์', icon: DeviceIcon },
  { key: 'schedule' as const, label: 'ตารางนัดรวม', icon: CalendarIcon },
  { key: 'overview' as const, label: 'ภาพรวมศูนย์', icon: ChartIcon },
]

export default function Sidebar({ page, setPage }: { page: PageKey, setPage: (p: PageKey) => void }) {
  return <aside className="sidebar">
    <div className="brand">
      <div className="brand-mark">ALS</div>
      <div><strong>ระบบฟื้นฟู ALS</strong><span>บุคลากร · เวชระเบียน</span></div>
    </div>
    <nav>
      {items.map(({ key, label, icon: Icon }) => <button key={key} className={page === key ? 'nav-item active' : 'nav-item'} onClick={() => setPage(key)}>
        <Icon /><span>{label}</span>
      </button>)}
    </nav>
    <div className="sidebar-footer">
      <div className="avatar">วร</div>
      <div><strong>วราภรณ์ ใจดี</strong><span>นักเวชระเบียน</span></div>
    </div>
  </aside>
}

import type { PageKey } from '../types'

const TABS: { key: PageKey; label: string; icon: string }[] = [
  { key: 'patient-home',         label: 'หน้าหลัก',    icon: '🏠' },
  { key: 'patient-appointments', label: 'นัดหมาย',     icon: '📅' },
  { key: 'patient-stats',        label: 'ผลการฝึก',    icon: '📈' },
  { key: 'patient-profile',      label: 'ฉัน',         icon: '👤' },
]

interface Props { page: PageKey; onNavigate: (p: PageKey) => void }

export default function PatientTabBar({ page, onNavigate }: Props) {
  return (
    <nav className="tab-bar">
      {TABS.map(t => (
        <button key={t.key} className={`tab-btn ${page === t.key ? 'active' : ''}`} onClick={() => onNavigate(t.key)}>
          <span className="tab-icon">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  )
}

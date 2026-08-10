import type { ComponentType } from 'react'
import type { PageKey } from '../types'
import { HomeIcon, CalendarIcon, TrendingUpIcon, MessageIcon, UserIcon, type IconProps } from './Icon'

const TABS: { key: PageKey; label: string; icon: ComponentType<IconProps> }[] = [
  { key: 'patient-home',         label: 'หน้าหลัก',   icon: HomeIcon },
  { key: 'patient-appointments', label: 'นัดหมาย',    icon: CalendarIcon },
  { key: 'patient-stats',        label: 'ผลการฝึก',   icon: TrendingUpIcon },
  { key: 'patient-feedback',     label: 'คำแนะนำ',    icon: MessageIcon },
  { key: 'patient-profile',      label: 'ฉัน',        icon: UserIcon },
]

interface Props { page: PageKey; onNavigate: (p: PageKey) => void }

export default function PatientTabBar({ page, onNavigate }: Props) {
  return (
    <nav className="tab-bar">
      {TABS.map(t => (
        <button key={t.key} className={`tab-btn ${page === t.key ? 'active' : ''}`} onClick={() => onNavigate(t.key)}>
          <t.icon size={19} />
          {t.label}
        </button>
      ))}
    </nav>
  )
}

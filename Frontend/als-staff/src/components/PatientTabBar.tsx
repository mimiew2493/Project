import type { ComponentType } from 'react'
import type { PageKey } from '../types'
import { Home, CalendarDays, TrendingUp, MessageSquare, User, type LucideProps } from 'lucide-react'

const TABS: { key: PageKey; label: string; icon: ComponentType<LucideProps> }[] = [
  { key: 'patient-home',         label: 'หน้าหลัก',   icon: Home },
  { key: 'patient-appointments', label: 'นัดหมาย',    icon: CalendarDays },
  { key: 'patient-stats',        label: 'ผลการฝึก',   icon: TrendingUp },
  { key: 'patient-feedback',     label: 'คำแนะนำ',    icon: MessageSquare },
  { key: 'patient-profile',      label: 'ฉัน',        icon: User },
]

interface Props { page: PageKey; onNavigate: (p: PageKey) => void }

export default function PatientTabBar({ page, onNavigate }: Props) {
  return (
    <nav className="flex shrink-0 border-t border-[#1B1E2C]/[.07] bg-white/75 pb-[env(safe-area-inset-bottom,0)] backdrop-blur-md">
      {TABS.map(t => {
        const active = page === t.key
        return (
          <button
            key={t.key}
            onClick={() => onNavigate(t.key)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] transition-colors ${active ? 'font-bold text-[#E5533A]' : 'text-[#82869C]'}`}
          >
            <t.icon size={19} strokeWidth={active ? 2.4 : 2} />
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}

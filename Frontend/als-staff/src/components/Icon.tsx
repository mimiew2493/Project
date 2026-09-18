import type { SVGProps } from 'react'

export interface IconProps extends SVGProps<SVGSVGElement> { size?: number }
type Props = IconProps

const Base = ({ size = 16, children, ...props }: Props) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}
  >
    {children}
  </svg>
)

export const HomeIcon = (p: Props) => <Base {...p}><path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></Base>
export const UsersIcon = (p: Props) => <Base {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></Base>
export const UserPlusIcon = (p: Props) => <Base {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></Base>
export const StethoscopeIcon = (p: Props) => <Base {...p}><path d="M6 4v6a5 5 0 0 0 10 0V4" /><path d="M6 4H4M16 4h2" /><circle cx="19" cy="15" r="2.5" /><path d="M16 10.5V13a3 3 0 0 1-3 3h0" /></Base>
export const BoxIcon = (p: Props) => <Base {...p}><path d="M21 8V7l-9-5-9 5v10l9 5 9-5V8Z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></Base>
export const CalendarIcon = (p: Props) => <Base {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M7 3v4M17 3v4" /></Base>
export const BarChartIcon = (p: Props) => <Base {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Base>
export const TrendingUpIcon = (p: Props) => <Base {...p}><path d="M23 6 13.5 15.5 8.5 10.5 1 18" /><path d="M17 6h6v6" /></Base>
export const UserIcon = (p: Props) => <Base {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></Base>
export const UserMdIcon = (p: Props) => <Base {...p}><circle cx="12" cy="7" r="4" /><path d="M5 21v-2a7 7 0 0 1 4-6.3" /><path d="M19 21v-2a7 7 0 0 0-4-6.3" /><path d="M12 15v3M10.5 16.5h3" /></Base>
export const CheckIcon = (p: Props) => <Base {...p}><path d="M20 6 9 17l-5-5" /></Base>
export const CheckCircleIcon = (p: Props) => <Base {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></Base>
export const XIcon = (p: Props) => <Base {...p}><path d="M18 6 6 18M6 6l12 12" /></Base>
export const XCircleIcon = (p: Props) => <Base {...p}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></Base>
export const AlertTriangleIcon = (p: Props) => <Base {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4M12 17h.01" /></Base>
export const SearchIcon = (p: Props) => <Base {...p}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></Base>
export const ToolIcon = (p: Props) => <Base {...p}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L2 19l3 3 7.3-7.3a4 4 0 0 0 5.4-5.4l-2.85 2.85-2.7-2.7Z" /></Base>
export const FileTextIcon = (p: Props) => <Base {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></Base>
export const ClipboardIcon = (p: Props) => <Base {...p}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" /></Base>
export const ArrowLeftIcon = (p: Props) => <Base {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></Base>
export const ArrowRightIcon = (p: Props) => <Base {...p}><path d="M5 12h14M12 5l7 7-7 7" /></Base>
export const ArrowLeftRightIcon = (p: Props) => <Base {...p}><path d="m8 3-4 4 4 4M4 7h16M16 21l4-4-4-4M20 17H4" /></Base>
export const WaveIcon = (p: Props) => <Base {...p}><path d="M18 11c0-1-.7-2-2-2s-2 1-2 2v2m4-2V8c0-1-.7-2-2-2s-2 1-2 2m4 5c0-1-.7-2-2-2s-2 1-2 2m-4 0V5c0-1-.7-2-2-2S8 4 8 5v6l-1.5-1.5a2 2 0 0 0-2.8 2.8L8 16c1.5 2 3 3 6 3h1a5 5 0 0 0 5-5v-1" /></Base>
export const LogOutIcon = (p: Props) => <Base {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></Base>
export const MessageIcon = (p: Props) => <Base {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" /></Base>
export const ClipboardListIcon = (p: Props) => <Base {...p}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" /><path d="M9 12h6M9 16h6M9 8h1" /></Base>
export const IdCardIcon = (p: Props) => <Base {...p}><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16a3 3 0 0 1 6 0M14 9h6M14 13h4" /></Base>
export const LockIcon = (p: Props) => <Base {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Base>
export const EyeIcon = (p: Props) => <Base {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></Base>
export const EyeOffIcon = (p: Props) => <Base {...p}><path d="M9.9 4.24A9.6 9.6 0 0 1 12 4c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.16 3.19M6.6 6.6C3.9 8.3 2 11 2 11s3.5 7 10 7a9.6 9.6 0 0 0 4.24-.94M9.9 9.9a3 3 0 0 0 4.24 4.24" /><path d="M2 2l20 20" /></Base>
export const LogInIcon = (p: Props) => <Base {...p}><path d="M14 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></Base>

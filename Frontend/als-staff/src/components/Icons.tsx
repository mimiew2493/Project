import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>
const Base = ({ children, ...props }: Props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>
export const UsersIcon = (p: Props) => <Base {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></Base>
export const PlusUserIcon = (p: Props) => <Base {...p}><path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></Base>
export const DeviceIcon = (p: Props) => <Base {...p}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M9 17h6"/></Base>
export const CalendarIcon = (p: Props) => <Base {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></Base>
export const ChartIcon = (p: Props) => <Base {...p}><path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 4-7"/></Base>
export const SearchIcon = (p: Props) => <Base {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Base>
export const ChevronIcon = (p: Props) => <Base {...p}><path d="m9 18 6-6-6-6"/></Base>
export const CheckIcon = (p: Props) => <Base {...p}><path d="m5 12 4 4L19 6"/></Base>

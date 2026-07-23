import { Link, useLocation } from 'react-router-dom'
import { patient } from '../data/mockData'

interface NavItem {
  path: string
  icon: string
  title: string
}

const navItems: NavItem[] = [
  { path: '/',         icon: '๐ ', title: 'Home' },
  { path: '/exercise', icon: '๐’ช', title: 'Exercise' },
  { path: '/stats',    icon: '๐“', title: 'Stats' },
  { path: '/feedback', icon: '๐’ฌ', title: 'Feedback' },
  { path: '/settings', icon: 'โ๏ธ', title: 'Settings' },
]

export default function Sidebar(): JSX.Element {
  const { pathname } = useLocation()
  return (
    <nav className="sidebar">
      <Link to="/" className="sidebar-logo">A</Link>
      {navItems.map((item) => (
        <Link key={item.path} to={item.path}
          className={`nav-item ${pathname === item.path ? 'active' : ''}`}
          title={item.title}>
          {item.icon}
        </Link>
      ))}
      <div className="sidebar-spacer" />
      <div className="sidebar-avatar" title="Profile">{patient.initials}</div>
    </nav>
  )
}

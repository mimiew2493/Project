import { useState } from 'react'
import type { AuthUser, PageKey } from './types'
import Sidebar from './components/Sidebar'
import PatientTabBar from './components/PatientTabBar'
import LoginPage from './pages/shared/LoginPage'
import SchedulePage from './pages/shared/SchedulePage'
import PatientsPage from './pages/staff/PatientsPage'
import RegisterPage from './pages/staff/RegisterPage'
import TherapistsPage from './pages/staff/TherapistsPage'
import DevicesPage from './pages/staff/DevicesPage'
import OverviewPage from './pages/staff/OverviewPage'
import MyCasesPage from './pages/therapist/MyCasesPage'
import ProfilePage from './pages/therapist/ProfilePage'
import PatientHomePage from './pages/patient/PatientHomePage'
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage'
import PatientStatsPage from './pages/patient/PatientStatsPage'
import PatientProfilePage from './pages/patient/PatientProfilePage'

export interface ResumeTarget { patientId: string; usersId: string }

interface Session { token: string; user: AuthUser }

const STAFF_PAGES: PageKey[] = ['queue', 'register', 'therapists', 'devices', 'schedule', 'overview']
const THERAPIST_PAGES: PageKey[] = ['my-cases', 'my-schedule', 'my-profile']
const PATIENT_PAGES: PageKey[] = ['patient-home', 'patient-appointments', 'patient-stats', 'patient-profile']

const loadSession = (): Session | null => {
  const raw = localStorage.getItem('als-session')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export default function App() {
  const [session, setSession] = useState<Session | null>(loadSession)
  const [page, setPage] = useState<PageKey>('queue')
  const [regStep, setRegStep] = useState(1)
  const [resume, setResume] = useState<ResumeTarget | null>(null)

  const handleLogin = (token: string, user: AuthUser) => {
    const s = { token, user }
    localStorage.setItem('als-session', JSON.stringify(s))
    setSession(s)
    setPage(user.role_id === 'R002' ? 'my-cases' : user.role_id === 'R001' ? 'patient-home' : 'queue')
  }

  const handleLogout = () => {
    localStorage.removeItem('als-session')
    setSession(null)
  }

  if (!session) return <LoginPage onLogin={handleLogin} />

  const isTherapist = session.user.role_id === 'R002'
  const isPatient = session.user.role_id === 'R001'
  const allowedPages = isPatient ? PATIENT_PAGES : isTherapist ? THERAPIST_PAGES : STAFF_PAGES
  const effectivePage = allowedPages.includes(page) ? page : allowedPages[0]

  const goto = (p: PageKey) => { setPage(p); setRegStep(1); setResume(null) }

  const openRegister = (target?: ResumeTarget & { step: number }) => {
    setPage('register')
    if (target) { setResume({ patientId: target.patientId, usersId: target.usersId }); setRegStep(target.step) }
    else { setResume(null); setRegStep(1) }
  }

  if (isPatient) {
    const patientId = session.user.patient_id ?? ''
    return (
      <div className="patient-shell">
        <div className="patient-topbar">
          <h1>ALS Rehab</h1>
          <p>ระบบติดตามการฝึกและนัดหมาย</p>
        </div>
        <div className="patient-content">
          {effectivePage === 'patient-home'         && <PatientHomePage patientId={patientId} />}
          {effectivePage === 'patient-appointments' && <PatientAppointmentsPage patientId={patientId} />}
          {effectivePage === 'patient-stats'        && <PatientStatsPage patientId={patientId} />}
          {effectivePage === 'patient-profile'      && <PatientProfilePage user={session.user} onLogout={handleLogout} />}
        </div>
        <PatientTabBar page={effectivePage} onNavigate={goto} />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar page={effectivePage} onNavigate={goto} user={session.user} onLogout={handleLogout} />
      <div className="main-area">
        <div className="topbar">
          <span>als-rehab.psu.ac.th/records</span>
          <div className="topbar-right"><span className="online-dot" /> ระบบพร้อมใช้งาน</div>
        </div>
        <div className="content-area">
          {!isTherapist && effectivePage === 'queue'      && <PatientsPage   onRegister={openRegister} />}
          {!isTherapist && effectivePage === 'register'   && <RegisterPage    step={regStep} setStep={setRegStep} resume={resume} onBack={() => goto('queue')} />}
          {!isTherapist && effectivePage === 'therapists' && <TherapistsPage />}
          {!isTherapist && effectivePage === 'devices'    && <DevicesPage />}
          {!isTherapist && effectivePage === 'schedule'   && <SchedulePage />}
          {!isTherapist && effectivePage === 'overview'   && <OverviewPage />}
          {isTherapist && effectivePage === 'my-cases'    && <MyCasesPage otId={session.user.ot_id ?? ''} />}
          {isTherapist && effectivePage === 'my-schedule' && <SchedulePage lockOtId={session.user.ot_id ?? undefined} />}
          {isTherapist && effectivePage === 'my-profile'  && <ProfilePage user={session.user} onLogout={handleLogout} />}
        </div>
      </div>
    </div>
  )
}

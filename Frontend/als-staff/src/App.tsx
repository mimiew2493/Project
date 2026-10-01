import { useState } from 'react'
import type { AuthUser, PageKey } from './types'
import Sidebar from './components/Sidebar'
import PatientTabBar from './components/PatientTabBar'
import LoginPage from './pages/shared/LoginPage'
import SchedulePage from './pages/shared/SchedulePage'
import PatientsPage from './pages/staff/PatientsPage'
import RegisterPage from './pages/staff/RegisterPage'
import TherapistsPage from './pages/staff/TherapistsPage'
// import StaffPage from './pages/staff/StaffPage' // ปิดใช้งานชั่วคราว
import DevicesPage from './pages/staff/DevicesPage'
import OverviewPage from './pages/staff/OverviewPage'
import TherapistHomePage from './pages/therapist/HomePage'
import MyCasesPage from './pages/therapist/MyCasesPage'
import ProfilePage from './pages/therapist/ProfilePage'
import ProgramLibraryPage from './pages/shared/ProgramLibraryPage'
import PatientHomePage from './pages/patient/PatientHomePage'
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage'
import PatientStatsPage from './pages/patient/PatientStatsPage'
import PatientFeedbackPage from './pages/patient/PatientFeedbackPage'
import PatientProfilePage from './pages/patient/PatientProfilePage'

export interface ResumeTarget { patientId: string; usersId: string }

interface Session { token: string; user: AuthUser }

const STAFF_PAGES: PageKey[] = ['overview', 'queue', 'register', 'therapists', 'devices', 'schedule', 'programs'] // 'staff' ปิดใช้งานชั่วคราว
const THERAPIST_PAGES: PageKey[] = ['my-home', 'my-cases', 'my-schedule', 'programs', 'my-profile']
const PATIENT_PAGES: PageKey[] = ['patient-home', 'patient-appointments', 'patient-stats', 'patient-feedback', 'patient-profile']

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
    setPage(user.role_id === 'R002' ? 'my-home' : user.role_id === 'R001' ? 'patient-home' : 'overview')
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
      <div className="pg-shell mx-auto flex h-screen max-w-[480px] flex-col border-x border-[#E4E1F0]">
        <div className="flex shrink-0 items-center justify-between border-b border-[#1B1E2C]/[.06] bg-white/70 px-4 py-3.5 backdrop-blur-md">
          <div>
            <h1 className="text-[15px] font-extrabold text-[#1B1E2C]">ALS Rehab</h1>
            <p className="text-[10.5px] text-[#82869C]">ระบบติดตามการฝึกและนัดหมาย</p>
          </div>
          <button onClick={handleLogout} className="rounded-xl border border-white/80 bg-white/60 px-3 py-1.5 text-[11px] font-bold text-[#62677D] hover:text-[#E5533A]">
            ออกจากระบบ
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {effectivePage === 'patient-home'         && <PatientHomePage patientId={patientId} onNavigate={goto} />}
          {effectivePage === 'patient-appointments' && <PatientAppointmentsPage patientId={patientId} />}
          {effectivePage === 'patient-stats'        && <PatientStatsPage patientId={patientId} />}
          {effectivePage === 'patient-feedback'     && <PatientFeedbackPage patientId={patientId} />}
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
        <div className="content-area">
          {!isTherapist && effectivePage === 'queue'      && <PatientsPage   user={session.user} onRegister={openRegister} />}
          {!isTherapist && effectivePage === 'register'   && <RegisterPage    step={regStep} setStep={setRegStep} resume={resume} onBack={() => goto('queue')} />}
          {!isTherapist && effectivePage === 'therapists' && <TherapistsPage user={session.user} />}
          {/* {!isTherapist && effectivePage === 'staff' && <StaffPage />} ปิดใช้งานชั่วคราว */}
          {!isTherapist && effectivePage === 'devices'    && <DevicesPage user={session.user} />}
          {!isTherapist && effectivePage === 'schedule'   && <SchedulePage user={session.user} />}
          {!isTherapist && effectivePage === 'overview'   && <OverviewPage user={session.user} onGoto={goto} />}
          {!isTherapist && effectivePage === 'programs'   && <ProgramLibraryPage user={session.user} usersId={session.user.users_id} roleId={session.user.role_id} />}
          {isTherapist && effectivePage === 'my-home'     && <TherapistHomePage otId={session.user.ot_id ?? ''} firstName={session.user.first_name} user={session.user} onOpenCases={() => goto('my-cases')} />}
          {isTherapist && effectivePage === 'my-cases'    && <MyCasesPage otId={session.user.ot_id ?? ''} usersId={session.user.users_id} user={session.user} />}
          {isTherapist && effectivePage === 'my-schedule' && <SchedulePage lockOtId={session.user.ot_id ?? undefined} user={session.user} />}
          {isTherapist && effectivePage === 'programs'    && <ProgramLibraryPage user={session.user} usersId={session.user.users_id} roleId={session.user.role_id} />}
          {isTherapist && effectivePage === 'my-profile'  && <ProfilePage user={session.user} onLogout={handleLogout} />}
        </div>
      </div>
    </div>
  )
}

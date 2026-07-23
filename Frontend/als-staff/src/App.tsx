import { useState } from 'react'
import Sidebar, { type PageKey } from './components/Sidebar'
import PatientsPage from './pages/PatientsPage'
import RegisterPage from './pages/RegisterPage'
import DevicesPage from './pages/DevicesPage'
import SchedulePage from './pages/SchedulePage'
import OverviewPage from './pages/OverviewPage'

export default function App() {
  const [page, setPage] = useState<PageKey>('patients')
  return <div className="app-shell">
    <Sidebar page={page} setPage={setPage}/>
    <main className="main-content">
      <div className="topbar"><span>als-rehab.psu.ac.th/records</span><div className="topbar-right"><span className="online-dot"/> ระบบพร้อมใช้งาน</div></div>
      <div className="content-wrap">
        {page === 'patients' && <PatientsPage onRegister={() => setPage('register')}/>} 
        {page === 'register' && <RegisterPage/>}
        {page === 'devices' && <DevicesPage/>}
        {page === 'schedule' && <SchedulePage/>}
        {page === 'overview' && <OverviewPage/>}
      </div>
    </main>
  </div>
}

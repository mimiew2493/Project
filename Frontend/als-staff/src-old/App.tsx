import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import RightPanel from './components/RightPanel'
import PatientHome from './pages/PatientHome'
import ExercisePage from './pages/ExercisePage'
import StatsPage from './pages/StatsPage'
import FeedbackPage from './pages/FeedbackPage'
import SettingsPage from './pages/SettingsPage'

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="main-area">
          <Routes>
            <Route path="/"         element={<PatientHome />} />
            <Route path="/exercise" element={<ExercisePage />} />
            <Route path="/stats"    element={<StatsPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
        <RightPanel />
      </div>
    </BrowserRouter>
  )
}

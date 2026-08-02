import { Navigate, Route, Routes } from 'react-router-dom'
import { StudySessionProvider } from './context/StudySessionContext.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ClassPlanner from './pages/ClassPlanner.jsx'
import DailyPlanner from './pages/DailyPlanner.jsx'
import Pomodoro from './pages/Pomodoro.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <StudySessionProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/classes" element={<ClassPlanner />} />
          <Route path="/planner" element={<DailyPlanner />} />
          <Route path="/pomodoro" element={<Pomodoro />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </StudySessionProvider>
  )
}

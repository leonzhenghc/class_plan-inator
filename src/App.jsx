import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { StudySessionProvider } from './context/StudySessionContext.jsx'
import { WorkspaceProvider } from './context/WorkspaceContext.jsx'
import RequireAuth from './components/auth/RequireAuth.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import { isSupabaseConfigured } from './lib/supabase.js'
import SetupRequired from './pages/SetupRequired.jsx'
import SignIn from './pages/SignIn.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ClassPlanner from './pages/ClassPlanner.jsx'
import DailyPlanner from './pages/DailyPlanner.jsx'
import Pomodoro from './pages/Pomodoro.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  // Without env vars there is no client to talk to, so explain rather than crash.
  if (!isSupabaseConfigured) return <SetupRequired />

  return (
    <AuthProvider>
      {/* One workspace fetch shared by the standard pages and the immersive timer. */}
      <WorkspaceProvider>
        <StudySessionProvider>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/onboarding" element={<Onboarding />} />

            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/classes" element={<ClassPlanner />} />
              <Route path="/planner" element={<DailyPlanner />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Immersive: owns the whole viewport, so it sits outside the standard chrome. */}
            <Route
              path="/pomodoro"
              element={
                <RequireAuth>
                  <Pomodoro />
                </RequireAuth>
              }
            />
          </Routes>
        </StudySessionProvider>
      </WorkspaceProvider>
    </AuthProvider>
  )
}

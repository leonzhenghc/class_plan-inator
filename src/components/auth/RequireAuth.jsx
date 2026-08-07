import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

/**
 * Gate for everything behind sign-in. Waits for the first session check so an
 * already-authenticated user never sees the sign-in screen flash, then sends
 * anyone mid-onboarding to finish it before reaching the app proper.
 */
export default function RequireAuth({ children }) {
  const { loading, user, profileLoaded, needsOnboarding } = useAuth()
  const location = useLocation()

  const spinner = (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
    </div>
  )

  if (loading) return spinner

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />
  }

  // Right after sign-up the session lands before the profile query returns. Hold
  // here rather than falling through, which would flash the app at someone who
  // still has onboarding to do.
  if (!profileLoaded) return spinner

  if (needsOnboarding) return <Navigate to="/onboarding" replace />

  return children
}

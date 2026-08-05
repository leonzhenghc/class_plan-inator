import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

/**
 * Gate for everything behind sign-in. Waits for the first session check so an
 * already-authenticated user never sees the sign-in screen flash, then sends
 * anyone mid-onboarding to finish it before reaching the app proper.
 */
export default function RequireAuth({ children }) {
  const { loading, user, profile, needsOnboarding } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />
  }

  // `profile` is null for the instant between sign-in and the row arriving.
  if (profile && needsOnboarding) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

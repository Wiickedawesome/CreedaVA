import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { isValidCreedaVAEmail } from '@/lib/utils'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Additional security: Verify user has @creedava.com email
  if (user.email && !isValidCreedaVAEmail(user.email)) {
    // Force logout if somehow a non-creedava user gets through
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

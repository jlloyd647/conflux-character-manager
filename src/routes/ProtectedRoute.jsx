import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getDashboardPath } from './routeRegistry'

function hasAccess(access, userType, isAuthenticated) {
  if (access === 'logged-out') {
    return !isAuthenticated
  }

  if (!isAuthenticated) {
    return false
  }

  switch (access) {
    case 'logged-in':
      return Boolean(userType)
    case 'staff':
      return userType === 'staff' || userType === 'admin'
    case 'admin':
      return userType === 'admin'
    default:
      return true
  }
}

export default function ProtectedRoute({ access, children }) {
  const { loading, isAuthenticated, userType } = useAuth()
  const location = useLocation()

  if (loading) {
    return null
  }

  if (!hasAccess(access, userType, isAuthenticated)) {
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />
    }

    return <Navigate to={getDashboardPath(userType)} replace />
  }

  return children
}

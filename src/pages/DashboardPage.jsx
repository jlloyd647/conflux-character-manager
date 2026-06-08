import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { userType, loading } = useAuth()

  useEffect(() => {
    if (!loading && userType === 'admin') {
      navigate('/admin', { replace: true })
    }
  }, [loading, userType, navigate])

  if (loading || userType === 'admin') {
    return null
  }

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      <p className="dashboard-intro">Manage your characters and explore the game.</p>
      <Link className="dashboard-action-link" to="/characters/create">
        Create Character
      </Link>
    </div>
  )
}

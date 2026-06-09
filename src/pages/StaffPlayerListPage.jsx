import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DataTable from '../components/DataTable'
import { useAuth } from '../hooks/useAuth'
import { listPlayers } from '../services/playerService'
import { formatDateToMmDdYyyy } from '../utils/formatDate'

const playerColumns = [
  { key: 'first_name', header: 'First Name' },
  { key: 'last_name', header: 'Last Name' },
  { key: 'email', header: 'Email' },
  { key: 'created_at', header: 'Created', format: formatDateToMmDdYyyy },
]

export default function StaffPlayerListPage() {
  const { loading: authLoading, role, userType, isAuthenticated, user } = useAuth()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('[StaffPlayerListPage] auth state:', {
      authLoading,
      isAuthenticated,
      userType,
      role,
      userId: user?.id ?? null,
    })
  }, [authLoading, isAuthenticated, userType, role, user])

  useEffect(() => {
    if (authLoading) {
      console.log('[StaffPlayerListPage] waiting for auth before loading players')
      return undefined
    }

    let active = true

    console.log('[StaffPlayerListPage] loading players…')

    listPlayers()
      .then((data) => {
        console.log('[StaffPlayerListPage] players loaded:', {
          count: data.length,
          data,
        })

        if (active) {
          setPlayers(data)
        }
      })
      .catch((loadError) => {
        console.error('[StaffPlayerListPage] failed to load players:', loadError)

        if (active) {
          setError(loadError.message)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
          console.log('[StaffPlayerListPage] load finished')
        }
      })

    return () => {
      active = false
    }
  }, [authLoading])

  return (
    <div className="list-page">
      <div className="list-page-header">
        <h1>Players</h1>
        {userType === 'admin' ? (
          <Link className="dashboard-action-link" to="/admin/players/new/edit">
            Create Player
          </Link>
        ) : null}
      </div>
      <p className="list-page-intro">View and manage registered players.</p>

      {error ? (
        <p className="list-page-error" role="alert">
          {error}
        </p>
      ) : null}

      {authLoading || loading ? (
        <p className="list-page-loading" role="status">
          Loading players…
        </p>
      ) : (
        <DataTable
          data={players}
          columns={playerColumns}
          emptyMessage="No players found."
          {...(userType === 'admin'
            ? { link: '/admin/players/:id/edit', linkId: 'id' }
            : {})}
        />
      )}
    </div>
  )
}

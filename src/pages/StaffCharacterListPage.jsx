import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DataTable from '../components/DataTable'
import { useAuth } from '../hooks/useAuth'
import { listCharacters } from '../services/characterService'
import { formatDateToMmDdYyyy } from '../utils/formatDate'

const characterColumns = [
  { key: 'character_id', header: 'Character ID' },
  { key: 'character_name', header: 'Character Name' },
  { key: 'xp', header: 'XP' },
  { key: 'player_id', header: 'Player ID' },
  { key: 'bloodline_id', header: 'Bloodline ID' },
  { key: 'created_at', header: 'Created', format: formatDateToMmDdYyyy },
]

export default function StaffCharacterListPage() {
  const { loading: authLoading, role, userType, isAuthenticated, user } = useAuth()
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    console.log('[StaffCharacterListPage] auth state:', {
      authLoading,
      isAuthenticated,
      userType,
      role,
      userId: user?.id ?? null,
    })
  }, [authLoading, isAuthenticated, userType, role, user])

  useEffect(() => {
    if (authLoading) {
      console.log('[StaffCharacterListPage] waiting for auth before loading characters')
      return undefined
    }

    let active = true

    console.log('[StaffCharacterListPage] loading characters…')

    listCharacters()
      .then((data) => {
        console.log('[StaffCharacterListPage] characters loaded:', {
          count: data.length,
          data,
        })

        if (active) {
          setCharacters(data)
        }
      })
      .catch((loadError) => {
        console.error('[StaffCharacterListPage] failed to load characters:', loadError)

        if (active) {
          setError(loadError.message)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
          console.log('[StaffCharacterListPage] load finished')
        }
      })

    return () => {
      active = false
    }
  }, [authLoading])

  return (
    <div className="list-page">
      <div className="list-page-header">
        <h1>Characters</h1>
        {userType === 'admin' ? (
          <Link className="dashboard-action-link" to="/admin/characters/new/edit">
            Create Character
          </Link>
        ) : null}
      </div>
      <p className="list-page-intro">View and manage registered characters.</p>

      {error ? (
        <p className="list-page-error" role="alert">
          {error}
        </p>
      ) : null}

      {authLoading || loading ? (
        <p className="list-page-loading" role="status">
          Loading characters…
        </p>
      ) : (
        <DataTable
          data={characters}
          columns={characterColumns}
          emptyMessage="No characters found."
          {...(userType === 'admin'
            ? { link: '/admin/characters/:id/edit', linkId: 'id' }
            : {})}
        />
      )}
    </div>
  )
}

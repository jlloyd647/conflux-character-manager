import { useEffect, useMemo, useState } from 'react'
import DataTable from './DataTable'
import { useAuth } from '../hooks/useAuth'
import { getUnapprovedPlayers } from '../services/playerService'
import { formatDateToMmDdYy } from '../utils/formatDate'

const PREFERRED_CONTACT_METHOD_LABELS = {
  1: 'Discord',
  2: 'Email',
}

function formatPreferredContactMethod(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return PREFERRED_CONTACT_METHOD_LABELS[Number(value)] ?? '—'
}

const columns = [
  { key: 'playerName', header: 'Player Name' },
  { key: 'email', header: 'Player Email' },
  { key: 'discordUsername', header: 'Player Discord' },
  {
    key: 'submittedAt',
    header: 'Date of submission',
    format: formatDateToMmDdYy,
  },
  {
    key: 'preferredContactMethod',
    header: 'New Player Liason Contact Method',
    format: formatPreferredContactMethod,
  },
]

function formatPlayerName(player) {
  if (!player) {
    return '—'
  }

  if (player.preferredName) {
    return player.preferredName
  }

  const fullName = [player.firstName, player.lastName].filter(Boolean).join(' ')

  return fullName || '—'
}

export default function ApprovalPendingPlayersSection() {
  const { loading: authLoading } = useAuth()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) {
      return undefined
    }

    let active = true

    setLoading(true)
    setError('')

    getUnapprovedPlayers()
      .then((pendingPlayers) => {
        if (active) {
          setPlayers(pendingPlayers)
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message)
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [authLoading])

  const tableRows = useMemo(
    () =>
      players.map((player) => ({
        id: player.id,
        playerName: formatPlayerName(player),
        email: player.email,
        discordUsername: player.discordUsername,
        submittedAt: player.createdAt,
        preferredContactMethod: player.preferredContactMethod,
      })),
    [players],
  )

  return (
    <section className="dashboard-section">
      <h2 className="dashboard-section-title">Approval Pending Players</h2>

      {error ? (
        <p className="dashboard-error" role="alert">
          {error}
        </p>
      ) : null}

      {authLoading || loading ? (
        <p className="dashboard-loading" role="status">
          Loading pending players…
        </p>
      ) : (
        <DataTable
          data={tableRows}
          columns={columns}
          emptyMessage="No players are awaiting approval."
          link="/admin/players/:id/approve"
          linkId="id"
        />
      )}
    </section>
  )
}

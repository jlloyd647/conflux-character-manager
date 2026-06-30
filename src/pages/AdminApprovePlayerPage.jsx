import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useRowStatusName } from '../hooks/useRowStatusName'
import {
  approvePlayer,
  getPlayerByID,
  PLAYER_STATUS,
} from '../services/playerService'
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

function ReadOnlyField({ label, value }) {
  return (
    <div className="dashboard-profile-field">
      <dt className="dashboard-profile-label">{label}</dt>
      <dd className="dashboard-profile-value">{value || '—'}</dd>
    </div>
  )
}

export default function AdminApprovePlayerPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loading: authLoading } = useAuth()
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approving, setApproving] = useState(false)
  const playerStatusName = useRowStatusName(player?.status)

  useEffect(() => {
    if (authLoading || !id) {
      return undefined
    }

    let active = true

    getPlayerByID(id)
      .then((data) => {
        if (!active) {
          return
        }

        if (!data) {
          setError('Player not found.')
          return
        }

        setPlayer(data)
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
  }, [authLoading, id])

  const isPendingApproval = player?.status === PLAYER_STATUS.PENDING_APPROVAL

  async function handleApprove() {
    if (!player?.id || approving || !isPendingApproval) {
      return
    }

    setApproving(true)
    setError('')

    try {
      await approvePlayer(player.id)
      navigate('/admin', { replace: true })
    } catch (approveError) {
      setError(approveError.message)
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="edit-page">
      <h1>Approve Player</h1>
      <p className="edit-page-back">
        <Link to="/admin">Back to Admin Dashboard</Link>
      </p>

      {error ? (
        <p className="list-page-error" role="alert">
          {error}
        </p>
      ) : null}

      {authLoading || loading ? (
        <p className="list-page-loading" role="status">
          Loading player…
        </p>
      ) : null}

      {!authLoading && !loading && player ? (
        <>
          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Player Info</h2>
            <div className="dashboard-card dashboard-profile-card">
              <div className="dashboard-profile-grid">
                <ReadOnlyField label="Player Name" value={formatPlayerName(player)} />
                <ReadOnlyField label="Player Email" value={player.email} />
                <ReadOnlyField label="Player Discord" value={player.discordUsername} />
                <ReadOnlyField label="Pronouns" value={player.pronouns} />
                <ReadOnlyField label="Status" value={playerStatusName} />
                <ReadOnlyField
                  label="Date of submission"
                  value={formatDateToMmDdYy(player.createdAt)}
                />
                <ReadOnlyField
                  label="New Player Liason Contact Method"
                  value={formatPreferredContactMethod(player.preferredContactMethod)}
                />
                <ReadOnlyField
                  label="How did you hear about Conflux"
                  value={player.hearAboutConflux}
                />
                <ReadOnlyField
                  label="What made you interested in Conflux"
                  value={player.interestedInConflux}
                />
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Approve</h2>
            <div className="dashboard-card dashboard-profile-card">
              {!isPendingApproval ? (
                <p className="character-approve-status" role="status">
                  This player has already been approved.
                </p>
              ) : null}
              <button
                type="button"
                className="dashboard-action-link edit-page-create-button"
                disabled={approving || !isPendingApproval}
                onClick={handleApprove}
              >
                {approving ? 'Approving…' : 'Approve Player'}
              </button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EditableField from '../components/EditableField'
import { useAuth } from '../hooks/useAuth'
import {
  createNewPlayer,
  getPlayerByID,
  updatePlayerColumnById,
} from '../services/playerService'
import { formatDateToMmDdYyyy } from '../utils/formatDate'

const EMPTY_PLAYER = {
  firstName: '',
  lastName: '',
  preferredName: '',
  pronouns: '',
  email: '',
  discordUsername: '',
}

function formatFieldValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function formatLabel(value) {
  if (!value) {
    return '—'
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="dashboard-profile-field">
      <dt className="dashboard-profile-label">{label}</dt>
      <dd className="dashboard-profile-value">{value || '—'}</dd>
    </div>
  )
}

export default function AdminPlayerEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loading: authLoading } = useAuth()
  const isCreateMode = id === 'new'
  const [player, setPlayer] = useState(null)
  const [draftPlayer, setDraftPlayer] = useState(EMPTY_PLAYER)
  const [loading, setLoading] = useState(!isCreateMode)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (authLoading || isCreateMode) {
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
  }, [authLoading, id, isCreateMode])

  function updatePlayerField(field) {
    return async (nextValue) => {
      const parsed = nextValue.trim()

      if (isCreateMode) {
        setDraftPlayer((previous) => ({
          ...previous,
          [field]: parsed,
        }))
        return
      }

      if (!player?.id) {
        throw new Error('Player not found')
      }

      const updatedPlayer = await updatePlayerColumnById(
        player.id,
        field,
        parsed,
      )

      setPlayer(updatedPlayer)
    }
  }

  async function handleCreate() {
    setCreating(true)
    setError('')

    try {
      const firstName = String(draftPlayer.firstName).trim()
      const email = String(draftPlayer.email).trim()

      if (!firstName) {
        throw new Error('First name is required.')
      }

      if (!email) {
        throw new Error('Email is required.')
      }

      const createdPlayer = await createNewPlayer({
        firstName,
        lastName: String(draftPlayer.lastName).trim(),
        preferredName: String(draftPlayer.preferredName).trim(),
        pronouns: String(draftPlayer.pronouns).trim(),
        email,
        discordUsername: String(draftPlayer.discordUsername).trim(),
      })

      navigate(`/admin/players/${createdPlayer.id}/edit`, { replace: true })
    } catch (createError) {
      setError(createError.message)
    } finally {
      setCreating(false)
    }
  }

  const activePlayer = isCreateMode ? draftPlayer : player
  const showForm = isCreateMode || Boolean(player)
  const headerName =
    activePlayer?.preferredName ||
    activePlayer?.firstName ||
    (isCreateMode ? '' : 'Player')

  return (
    <div className="edit-page">
      <h1>{isCreateMode ? 'Create Player' : 'Edit Player'}</h1>
      <p className="edit-page-back">
        <Link to="/staff/players">Back to Players</Link>
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

      {!authLoading && !loading && showForm ? (
        <section className="dashboard-section">
          <div className="dashboard-card dashboard-profile-card">
            <div className="dashboard-profile-field">
              <EditableField
                value={formatFieldValue(headerName)}
                placeholder="Preferred name"
                fontSizePx={32}
                editLabel="Edit preferred name"
                onSave={updatePlayerField('preferredName')}
              />
            </div>
            <div className="dashboard-profile-grid">
              <div className="dashboard-profile-field">
                <EditableField
                  label="First name"
                  value={formatFieldValue(activePlayer?.firstName)}
                  placeholder="First name"
                  onSave={updatePlayerField('firstName')}
                />
              </div>
              <div className="dashboard-profile-field">
                <EditableField
                  label="Last name"
                  value={formatFieldValue(activePlayer?.lastName)}
                  placeholder="Last name"
                  onSave={updatePlayerField('lastName')}
                />
              </div>
              <div className="dashboard-profile-field">
                <EditableField
                  label="Pronouns"
                  value={formatFieldValue(activePlayer?.pronouns)}
                  placeholder="e.g. she/her"
                  onSave={updatePlayerField('pronouns')}
                />
              </div>
              <div className="dashboard-profile-field">
                <EditableField
                  label="Email"
                  value={formatFieldValue(activePlayer?.email)}
                  inputType="email"
                  placeholder="you@example.com"
                  onSave={updatePlayerField('email')}
                />
              </div>
              <div className="dashboard-profile-field">
                <EditableField
                  label="Discord"
                  value={formatFieldValue(activePlayer?.discordUsername)}
                  placeholder="username"
                  onSave={updatePlayerField('discordUsername')}
                />
              </div>
              {!isCreateMode && player?.status ? (
                <ReadOnlyField label="Status" value={formatLabel(player.status)} />
              ) : null}
              {!isCreateMode && player?.createdAt ? (
                <ReadOnlyField
                  label="Created"
                  value={formatDateToMmDdYyyy(player.createdAt)}
                />
              ) : null}
              {!isCreateMode && player?.updatedAt ? (
                <ReadOnlyField
                  label="Updated"
                  value={formatDateToMmDdYyyy(player.updatedAt)}
                />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {isCreateMode && showForm ? (
        <button
          type="button"
          className="dashboard-action-link edit-page-create-button"
          disabled={creating}
          onClick={handleCreate}
        >
          {creating ? 'Creating…' : 'Create Player'}
        </button>
      ) : null}
    </div>
  )
}

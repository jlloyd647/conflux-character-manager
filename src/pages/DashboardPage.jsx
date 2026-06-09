import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import EditableField from '../components/EditableField'
import { useAuth } from '../hooks/useAuth'
import {
  getPlayerByUserId,
  updatePlayerColumnById,
} from '../services/playerService'

function formatMemberSince(dateString) {
  if (!dateString) {
    return null
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatLabel(value) {
  if (!value) {
    return '—'
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function ProfileField({ label, value }) {
  return (
    <div className="dashboard-profile-field">
      <dt className="dashboard-profile-label">{label}</dt>
      <dd className="dashboard-profile-value">{value || '—'}</dd>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, userType, loading: authLoading } = useAuth()
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && userType === 'admin') {
      navigate('/admin', { replace: true })
    }
  }, [authLoading, userType, navigate])

  useEffect(() => {
    if (authLoading || !user?.id) {
      return undefined
    }

    let active = true

    getPlayerByUserId(user.id)
      .then((data) => {
        if (active) {
          setPlayer(data)
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
  }, [authLoading, user?.id])

  if (authLoading || userType === 'admin') {
    return null
  }

  const welcomeName = player?.preferredName || player?.firstName || 'Player'
  const memberSince = formatMemberSince(player?.createdAt)

  function updatePlayerField(field) {
    return async (nextValue) => {
      if (!player?.id) {
        throw new Error('Player not found')
      }

      const updatedPlayer = await updatePlayerColumnById(
        player.id,
        field,
        nextValue,
      )

      setPlayer(updatedPlayer)
    }
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-section dashboard-welcome">
        <h1>Welcome, {welcomeName}</h1>
        <p className="dashboard-intro">
          Manage your characters and explore upcoming game events.
        </p>
      </section>

      {error ? (
        <p className="dashboard-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="dashboard-loading" role="status">
          Loading your profile…
        </p>
      ) : null}

      {!loading && !error && !player ? (
        <section className="dashboard-section dashboard-empty-state">
          <h2>Profile not found</h2>
          <p>
            We could not find a player profile linked to your account. Please
            contact staff if you believe this is an error.
          </p>
        </section>
      ) : null}

      {!loading && player ? (
        <>
          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Profile</h2>
            <div className="dashboard-card dashboard-profile-card">
              <div className="dashboard-profile-grid">
                <div className="dashboard-profile-field">
                  <EditableField
                    label="First name"
                    value={player.firstName}
                    placeholder="First name"
                    onSave={updatePlayerField('firstName')}
                  />
                </div>
                <div className="dashboard-profile-field">
                  <EditableField
                    label="Last name"
                    value={player.lastName}
                    placeholder="Last name"
                    onSave={updatePlayerField('lastName')}
                  />
                </div>
                <div className="dashboard-profile-field">
                  <EditableField
                    label="Preferred name"
                    value={player.preferredName}
                    placeholder="Preferred name"
                    onSave={updatePlayerField('preferredName')}
                  />
                </div>
                <div className="dashboard-profile-field">
                  <EditableField
                    label="Pronouns"
                    value={player.pronouns}
                    placeholder="e.g. she/her"
                    onSave={updatePlayerField('pronouns')}
                  />
                </div>
                <div className="dashboard-profile-field">
                  <EditableField
                    label="Email"
                    value={player.email}
                    inputType="email"
                    placeholder="you@example.com"
                    onSave={updatePlayerField('email')}
                  />
                </div>
                <ProfileField label="Status" value={formatLabel(player.status)} />
                <div className="dashboard-profile-field">
                  <EditableField
                    label="Discord"
                    value={player.discordUsername}
                    placeholder="username"
                    onSave={updatePlayerField('discordUsername')}
                  />
                </div>
                {memberSince ? (
                  <ProfileField label="Member since" value={memberSince} />
                ) : null}
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Characters</h2>
            <div className="dashboard-card dashboard-empty-card">
              <p>You do not have any characters yet.</p>
              <Link className="dashboard-action-link" to="/characters/create">
                Create Character
              </Link>
            </div>
          </section>

          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Upcoming Events</h2>
            <div className="dashboard-card dashboard-empty-card">
              <p>No upcoming events to show right now.</p>
            </div>
          </section>

          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Quick Actions</h2>
            <div className="dashboard-quick-actions">
              <Link className="dashboard-action-link" to="/characters/create">
                Create Character
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

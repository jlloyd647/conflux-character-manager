import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createNewPlayer, getPlayerByUserId, PLAYER_STATUS } from '../services/playerService'

const EMPTY_PLAYER = {
  firstName: '',
  lastName: '',
  pronouns: '',
  email: '',
  discordUsername: '',
  preferredContactMethod: '',
  hearAboutConflux: '',
  interestedInConflux: '',
}

const PREFERRED_CONTACT_METHOD = {
  DISCORD: 1,
  EMAIL: 2,
}

const PREFERRED_CONTACT_METHOD_OPTIONS = [
  { value: String(PREFERRED_CONTACT_METHOD.DISCORD), label: 'Discord' },
  { value: String(PREFERRED_CONTACT_METHOD.EMAIL), label: 'Email' },
]

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function hasRequiredFields(player) {
  return (
    Boolean(String(player.firstName).trim()) &&
    Boolean(String(player.lastName).trim()) &&
    Boolean(String(player.email).trim())
  )
}

export default function NewPlayerPage() {
  const navigate = useNavigate()
  const { user, userType, loading: authLoading } = useAuth()
  const [draftPlayer, setDraftPlayer] = useState(EMPTY_PLAYER)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [creating, setCreating] = useState(false)

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
        if (!active) {
          return
        }

        if (data) {
          navigate('/dashboard', { replace: true })
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
  }, [authLoading, navigate, user?.id])

  useEffect(() => {
    if (!user?.email) {
      return
    }

    setDraftPlayer((previous) => ({
      ...previous,
      email: previous.email || user.email,
    }))
  }, [user?.email])

  function updateField(field) {
    return (event) => {
      setDraftPlayer((previous) => ({
        ...previous,
        [field]: event.target.value,
      }))
    }
  }

  function validateForm() {
    const errors = {}
    const firstName = String(draftPlayer.firstName).trim()
    const lastName = String(draftPlayer.lastName).trim()
    const email = String(draftPlayer.email).trim()

    if (!firstName) {
      errors.firstName = 'First name is required.'
    }

    if (!lastName) {
      errors.lastName = 'Last name is required.'
    }

    if (!email) {
      errors.email = 'Email is required.'
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const canSubmit = hasRequiredFields(draftPlayer)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setCreating(true)

    try {
      const firstName = String(draftPlayer.firstName).trim()
      const lastName = String(draftPlayer.lastName).trim()
      const email = String(draftPlayer.email).trim()
      const preferredContactMethod = Number(draftPlayer.preferredContactMethod)

      if (
        preferredContactMethod !== PREFERRED_CONTACT_METHOD.DISCORD &&
        preferredContactMethod !== PREFERRED_CONTACT_METHOD.EMAIL
      ) {
        throw new Error('Preferred method of contact is required.')
      }

      if (!user?.id) {
        throw new Error('Not authenticated')
      }

      await createNewPlayer({
        userId: user.id,
        firstName,
        lastName,
        pronouns: String(draftPlayer.pronouns).trim(),
        email,
        discordUsername: String(draftPlayer.discordUsername).trim(),
        preferredContactMethod,
        hearAboutConflux: String(draftPlayer.hearAboutConflux).trim(),
        interestedInConflux: String(draftPlayer.interestedInConflux).trim(),
        status: PLAYER_STATUS.PENDING_APPROVAL,
      })

      navigate('/dashboard', { replace: true })
    } catch (createError) {
      setError(createError.message)
    } finally {
      setCreating(false)
    }
  }

  if (authLoading || userType === 'admin') {
    return null
  }

  return (
    <div className="edit-page">
      <h1>Create Your Player Profile</h1>
      <p className="edit-page-intro">
        Complete your profile to get started with Conflux.
      </p>

      {error ? (
        <p className="list-page-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="list-page-loading" role="status">
          Loading…
        </p>
      ) : null}

      {!loading ? (
        <form className="new-player-form" onSubmit={handleSubmit} noValidate>
          <section className="dashboard-section">
            <div className="dashboard-card dashboard-profile-card">
              <div className="dashboard-profile-grid">
                <div className="auth-form-field">
                  <label className="auth-form-label" htmlFor="new-player-first-name">
                    Player first name
                  </label>
                  <input
                    id="new-player-first-name"
                    className="auth-form-input"
                    type="text"
                    autoComplete="given-name"
                    value={draftPlayer.firstName}
                    placeholder="First name"
                    aria-invalid={Boolean(fieldErrors.firstName)}
                    aria-describedby={
                      fieldErrors.firstName ? 'new-player-first-name-error' : undefined
                    }
                    onChange={updateField('firstName')}
                  />
                  {fieldErrors.firstName ? (
                    <p
                      className="auth-form-field-error"
                      id="new-player-first-name-error"
                      role="alert"
                    >
                      {fieldErrors.firstName}
                    </p>
                  ) : null}
                </div>
                <div className="auth-form-field">
                  <label className="auth-form-label" htmlFor="new-player-last-name">
                    Player last name
                  </label>
                  <input
                    id="new-player-last-name"
                    className="auth-form-input"
                    type="text"
                    autoComplete="family-name"
                    value={draftPlayer.lastName}
                    placeholder="Last name"
                    aria-invalid={Boolean(fieldErrors.lastName)}
                    aria-describedby={
                      fieldErrors.lastName ? 'new-player-last-name-error' : undefined
                    }
                    onChange={updateField('lastName')}
                  />
                  {fieldErrors.lastName ? (
                    <p
                      className="auth-form-field-error"
                      id="new-player-last-name-error"
                      role="alert"
                    >
                      {fieldErrors.lastName}
                    </p>
                  ) : null}
                </div>
                <div className="auth-form-field">
                  <label className="auth-form-label" htmlFor="new-player-pronouns">
                    Player pronouns
                  </label>
                  <input
                    id="new-player-pronouns"
                    className="auth-form-input"
                    type="text"
                    value={draftPlayer.pronouns}
                    placeholder="e.g. she/her"
                    onChange={updateField('pronouns')}
                  />
                </div>
                <div className="auth-form-field">
                  <label className="auth-form-label" htmlFor="new-player-email">
                    Player email
                  </label>
                  <input
                    id="new-player-email"
                    className="auth-form-input"
                    type="email"
                    autoComplete="email"
                    value={draftPlayer.email}
                    placeholder="you@example.com"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={
                      fieldErrors.email ? 'new-player-email-error' : undefined
                    }
                    onChange={updateField('email')}
                  />
                  {fieldErrors.email ? (
                    <p
                      className="auth-form-field-error"
                      id="new-player-email-error"
                      role="alert"
                    >
                      {fieldErrors.email}
                    </p>
                  ) : null}
                </div>
                <div className="auth-form-field">
                  <label className="auth-form-label" htmlFor="new-player-discord">
                    Player Discord username
                  </label>
                  <input
                    id="new-player-discord"
                    className="auth-form-input"
                    type="text"
                    value={draftPlayer.discordUsername}
                    placeholder="username"
                    onChange={updateField('discordUsername')}
                  />
                </div>
                <div className="auth-form-field">
                  <label
                    className="auth-form-label"
                    htmlFor="new-player-preferred-contact-method"
                  >
                    Preferred method of contact
                  </label>
                  <select
                    id="new-player-preferred-contact-method"
                    className="auth-form-input new-player-contact-select"
                    value={draftPlayer.preferredContactMethod}
                    onChange={updateField('preferredContactMethod')}
                  >
                    <option value="">Select contact method</option>
                    {PREFERRED_CONTACT_METHOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="auth-form-field new-player-text-field">
                <label className="auth-form-label" htmlFor="new-player-hear-about">
                  How did you hear about Conflux
                </label>
                <textarea
                  id="new-player-hear-about"
                  className="auth-form-input editable-field-textarea new-player-textarea"
                  value={draftPlayer.hearAboutConflux}
                  placeholder="Tell us how you found Conflux"
                  rows={4}
                  onChange={updateField('hearAboutConflux')}
                />
              </div>
              <div className="auth-form-field new-player-text-field">
                <label className="auth-form-label" htmlFor="new-player-interested">
                  What made you interested in Conflux
                </label>
                <textarea
                  id="new-player-interested"
                  className="auth-form-input editable-field-textarea new-player-textarea"
                  value={draftPlayer.interestedInConflux}
                  placeholder="Tell us what drew you to Conflux"
                  rows={4}
                  onChange={updateField('interestedInConflux')}
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            className="dashboard-action-link edit-page-create-button"
            disabled={creating || !canSubmit}
          >
            {creating ? 'Creating…' : 'Create Player Profile'}
          </button>
        </form>
      ) : null}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createCharacter } from '../services/characterService'
import { getPlayerByUserId } from '../services/playerService'
import { useReferenceDataStore } from '../stores/referenceDataStore'

const EMPTY_CHARACTER = {
  characterName: '',
  bloodlineId: '',
  kingroupId: '',
  nplContactMethod: '',
  backstory: '',
}

const BACKSTORY_MAX_LENGTH = 10000

const NPL_CONTACT_METHOD = {
  DISCORD: 1,
  EMAIL: 2,
  DECLINE: 3,
}

const NPL_CONTACT_METHOD_OPTIONS = [
  { value: String(NPL_CONTACT_METHOD.DISCORD), label: 'Discord' },
  { value: String(NPL_CONTACT_METHOD.EMAIL), label: 'Email' },
  {
    value: String(NPL_CONTACT_METHOD.DECLINE),
    label: 'I do not want to meet with a Player Liason',
  },
]

const NPL_CONTACT_METHOD_LABEL =
  'What is your preferred method of a Player Liaison reaching out to assist you with character creation?'

const EMPTY_CREATE_STATS = {
  vitality: 0,
  mind: 0,
  strength: 0,
  willpower: 0,
}

function parseIntegerField(value, label) {
  const parsed = Number.parseInt(String(value).trim(), 10)

  if (Number.isNaN(parsed)) {
    throw new Error(`${label} must be a valid number.`)
  }

  return parsed
}

function parseOptionalIntegerField(value, label) {
  const trimmed = String(value).trim()

  if (!trimmed) {
    return null
  }

  return parseIntegerField(trimmed, label)
}

function hasProfileValue(value) {
  return Boolean(String(value ?? '').trim())
}

function getNplContactWarning(nplContactMethod, player) {
  const method = Number(nplContactMethod)

  if (method === NPL_CONTACT_METHOD.DISCORD && !hasProfileValue(player?.discordUsername)) {
    return 'Your Discord username is not on your profile. Please update it on your dashboard so a Player Liaison can reach you.'
  }

  if (method === NPL_CONTACT_METHOD.EMAIL && !hasProfileValue(player?.email)) {
    return 'Your email is not on your profile. Please update it on your dashboard so a Player Liaison can reach you.'
  }

  return ''
}

export default function CharacterCreatePage() {
  const navigate = useNavigate()
  const { user, userType, loading: authLoading } = useAuth()
  const [player, setPlayer] = useState(null)
  const [draftCharacter, setDraftCharacter] = useState(EMPTY_CHARACTER)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const bloodlines = useReferenceDataStore((state) => state.bloodlines)
  const loadBloodlines = useReferenceDataStore((state) => state.loadBloodlines)
  const kingroups = useReferenceDataStore((state) => state.kingroups)
  const loadKingroups = useReferenceDataStore((state) => state.loadKingroups)

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

  useEffect(() => {
    if (authLoading) {
      return undefined
    }

    const { bloodlines: storedBloodlines, bloodlinesLoading, kingroups: storedKingroups, kingroupsLoading } =
      useReferenceDataStore.getState()

    if (!storedBloodlines.length && !bloodlinesLoading) {
      loadBloodlines().catch(() => {})
    }

    if (!storedKingroups.length && !kingroupsLoading) {
      loadKingroups().catch(() => {})
    }
  }, [authLoading, loadBloodlines, loadKingroups])

  function updateDraftField(field, value) {
    setDraftCharacter((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  function handleBloodlineChange(nextValue) {
    setDraftCharacter((previous) => ({
      ...previous,
      bloodlineId: nextValue,
      kingroupId: '',
    }))
  }

  async function handleCreate() {
    setCreating(true)
    setError('')

    try {
      if (!player?.playerId) {
        throw new Error('Player profile not found.')
      }

      const characterName = String(draftCharacter.characterName).trim()

      if (!characterName) {
        throw new Error('Character name is required.')
      }

      const bloodlineId = parseIntegerField(draftCharacter.bloodlineId, 'Bloodline')
      const bloodline = bloodlines.find((entry) => entry.bloodlineID === bloodlineId) ?? null

      if (!bloodline) {
        throw new Error('Bloodline is required.')
      }

      const nplContactMethod = parseIntegerField(
        draftCharacter.nplContactMethod,
        'Player Liaison contact method',
      )

      if (
        nplContactMethod !== NPL_CONTACT_METHOD.DISCORD &&
        nplContactMethod !== NPL_CONTACT_METHOD.EMAIL &&
        nplContactMethod !== NPL_CONTACT_METHOD.DECLINE
      ) {
        throw new Error('Please select how a Player Liaison may contact you.')
      }

      const backstory = String(draftCharacter.backstory ?? '').trim()

      if (backstory.length > BACKSTORY_MAX_LENGTH) {
        throw new Error(`Backstory must be ${BACKSTORY_MAX_LENGTH} characters or fewer.`)
      }

      await createCharacter({
        characterName,
        playerId: player.playerId,
        bloodlineId,
        kingroupId: parseOptionalIntegerField(draftCharacter.kingroupId, 'Kin Group'),
        backstory,
        nplContactMethod,
        stats: EMPTY_CREATE_STATS,
      })

      setSubmitted(true)
    } catch (createError) {
      setError(createError.message)
    } finally {
      setCreating(false)
    }
  }

  const bloodlineOptions = useMemo(
    () =>
      bloodlines.map((bloodline) => ({
        value: bloodline.bloodlineID,
        label: bloodline.bloodlineName,
      })),
    [bloodlines],
  )

  const kingroupOptions = useMemo(() => {
    const bloodlineId = Number(draftCharacter.bloodlineId)

    if (!draftCharacter.bloodlineId || Number.isNaN(bloodlineId)) {
      return []
    }

    return kingroups
      .filter((kingroup) => kingroup.bloodlineID === bloodlineId)
      .map((kingroup) => ({
        value: kingroup.kingroupID,
        label: kingroup.kingroupName,
      }))
  }, [kingroups, draftCharacter.bloodlineId])

  const nplContactWarning = useMemo(
    () => getNplContactWarning(draftCharacter.nplContactMethod, player),
    [draftCharacter.nplContactMethod, player],
  )

  if (authLoading || userType === 'admin') {
    return null
  }

  return (
    <div className="edit-page">
      <h1>Create Character</h1>
      <p className="edit-page-back">
        <Link to="/dashboard">Back to Dashboard</Link>
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

      {!loading && !player ? (
        <section className="dashboard-section dashboard-empty-state">
          <h2>Profile not found</h2>
          <p>
            We could not find a player profile linked to your account. Please
            contact staff if you believe this is an error.
          </p>
        </section>
      ) : null}

      {!loading && player && submitted ? (
        <section className="dashboard-section">
          <div className="dashboard-card dashboard-profile-card">
            <h2 className="dashboard-section-title">Character submitted</h2>
            <p>
              Your character has been submitted. An admin will need to approve
              your character before it is active in the game.
            </p>
            <Link className="dashboard-action-link" to="/dashboard">
              Return to Dashboard
            </Link>
          </div>
        </section>
      ) : null}

      {!loading && player && !submitted ? (
        <>
          <section className="dashboard-section">
            <div className="dashboard-card dashboard-profile-card">
              <div className="dashboard-profile-grid">
                <div className="dashboard-profile-field">
                  <label className="dashboard-profile-label" htmlFor="character-name">
                    Character Name
                  </label>
                  <input
                    id="character-name"
                    className="auth-form-input character-create-form-input"
                    type="text"
                    value={draftCharacter.characterName}
                    placeholder="Character name"
                    onChange={(event) => updateDraftField('characterName', event.target.value)}
                  />
                </div>
                <div className="dashboard-profile-field">
                  <label className="dashboard-profile-label" htmlFor="character-bloodline">
                    Bloodline
                  </label>
                  <select
                    id="character-bloodline"
                    className="auth-form-input character-create-form-input"
                    value={draftCharacter.bloodlineId}
                    onChange={(event) => handleBloodlineChange(event.target.value)}
                  >
                    <option value="">Select bloodline</option>
                    {bloodlineOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="dashboard-profile-field">
                  <label className="dashboard-profile-label" htmlFor="character-kin-group">
                    Kin Group
                  </label>
                  <select
                    id="character-kin-group"
                    className="auth-form-input character-create-form-input"
                    value={draftCharacter.kingroupId}
                    disabled={!draftCharacter.bloodlineId}
                    onChange={(event) => updateDraftField('kingroupId', event.target.value)}
                  >
                    <option value="">Select kingroup</option>
                    {kingroupOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="dashboard-profile-field character-create-npl-contact-field">
                <label className="dashboard-profile-label" htmlFor="character-npl-contact-method">
                  {NPL_CONTACT_METHOD_LABEL}
                </label>
                <select
                  id="character-npl-contact-method"
                  className="auth-form-input character-create-form-input"
                  value={draftCharacter.nplContactMethod}
                  onChange={(event) => {
                    setDraftCharacter((previous) => ({
                      ...previous,
                      nplContactMethod: event.target.value,
                    }))
                  }}
                >
                  <option value="">Select contact method</option>
                  {NPL_CONTACT_METHOD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {nplContactWarning ? (
                  <p className="character-create-contact-warning" role="status">
                    {nplContactWarning}
                  </p>
                ) : null}
              </div>
              <div className="dashboard-profile-field character-create-backstory-field">
                <label className="dashboard-profile-label" htmlFor="character-backstory">
                  Backstory
                </label>
                <textarea
                  id="character-backstory"
                  className="auth-form-input editable-field-textarea character-create-form-input"
                  value={draftCharacter.backstory}
                  placeholder="Tell us about your character…"
                  maxLength={BACKSTORY_MAX_LENGTH}
                  rows={6}
                  onChange={(event) => {
                    setDraftCharacter((previous) => ({
                      ...previous,
                      backstory: event.target.value,
                    }))
                  }}
                />
                <p className="character-create-backstory-count" aria-live="polite">
                  {draftCharacter.backstory.length} / {BACKSTORY_MAX_LENGTH}
                </p>
                <p className="character-create-approval-disclaimer">
                  After you submit, an admin will review and approve your character
                  before it becomes active in the game.
                </p>
              </div>
            </div>
          </section>

          <button
            type="button"
            className="dashboard-action-link edit-page-create-button"
            disabled={creating}
            onClick={handleCreate}
          >
            {creating ? 'Submitting…' : 'Submit Character'}
          </button>
        </>
      ) : null}
    </div>
  )
}

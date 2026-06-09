import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EditableField from '../components/EditableField'
import { useAuth } from '../hooks/useAuth'
import {
  createCharacter,
  getCharacterById,
  updateCharacterColumnById,
} from '../services/characterService'
import { formatDateToMmDdYyyy } from '../utils/formatDate'

const EMPTY_CHARACTER = {
  characterName: '',
  playerId: '',
  bloodlineId: '',
  xp: '0',
}

function parseIntegerField(value, label) {
  const parsed = Number.parseInt(String(value).trim(), 10)

  if (Number.isNaN(parsed)) {
    throw new Error(`${label} must be a valid number.`)
  }

  return parsed
}

function formatFieldValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="dashboard-profile-field">
      <dt className="dashboard-profile-label">{label}</dt>
      <dd className="dashboard-profile-value">{value || '—'}</dd>
    </div>
  )
}

export default function AdminCharacterEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loading: authLoading } = useAuth()
  const isCreateMode = id === 'new'
  const [character, setCharacter] = useState(null)
  const [draftCharacter, setDraftCharacter] = useState(EMPTY_CHARACTER)
  const [loading, setLoading] = useState(!isCreateMode)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (authLoading || isCreateMode) {
      return undefined
    }

    let active = true

    getCharacterById(id)
      .then((data) => {
        if (!active) {
          return
        }

        if (!data) {
          setError('Character not found.')
          return
        }

        setCharacter(data)
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

  function updateCharacterField(field, parser = (value) => value) {
    return async (nextValue) => {
      const parsed = parser(nextValue)

      if (isCreateMode) {
        setDraftCharacter((previous) => ({
          ...previous,
          [field]: parsed,
        }))
        return
      }

      if (!character?.id) {
        throw new Error('Character not found')
      }

      const updatedCharacter = await updateCharacterColumnById(
        character.id,
        field,
        parsed,
      )

      setCharacter(updatedCharacter)
    }
  }

  async function handleCreate() {
    setCreating(true)
    setError('')

    try {
      const characterName = String(draftCharacter.characterName).trim()
      const playerId = String(draftCharacter.playerId).trim()

      if (!characterName) {
        throw new Error('Character name is required.')
      }

      if (!playerId) {
        throw new Error('Player ID is required.')
      }

      const createdCharacter = await createCharacter({
        characterName,
        playerId,
        bloodlineId: parseIntegerField(draftCharacter.bloodlineId, 'Bloodline ID'),
        xp: parseIntegerField(draftCharacter.xp, 'XP'),
      })

      navigate(`/admin/characters/${createdCharacter.id}/edit`, { replace: true })
    } catch (createError) {
      setError(createError.message)
    } finally {
      setCreating(false)
    }
  }

  const activeCharacter = isCreateMode ? draftCharacter : character
  const showForm = isCreateMode || Boolean(character)
  const headerName = activeCharacter?.characterName || (isCreateMode ? '' : 'Character')

  return (
    <div className="edit-page">
      <h1>{isCreateMode ? 'Create Character' : 'Edit Character'}</h1>
      <p className="edit-page-back">
        <Link to="/staff/characters">Back to Characters</Link>
      </p>

      {error ? (
        <p className="list-page-error" role="alert">
          {error}
        </p>
      ) : null}

      {authLoading || loading ? (
        <p className="list-page-loading" role="status">
          Loading character…
        </p>
      ) : null}

      {!authLoading && !loading && showForm ? (
        <section className="dashboard-section">
          <div className="dashboard-card dashboard-profile-card">
            <div className="dashboard-profile-field">
              <EditableField
                value={formatFieldValue(headerName)}
                placeholder="Character name"
                fontSizePx={32}
                editLabel="Edit character name"
                onSave={updateCharacterField('characterName', (value) => value.trim())}
              />
            </div>
            <div className="dashboard-profile-grid">
              <div className="dashboard-profile-field">
                <EditableField
                  label="XP"
                  value={formatFieldValue(activeCharacter?.xp)}
                  inputType="number"
                  onSave={updateCharacterField('xp', (value) =>
                    parseIntegerField(value, 'XP'),
                  )}
                />
              </div>
              <div className="dashboard-profile-field">
                <EditableField
                  label="Bloodline ID"
                  value={formatFieldValue(activeCharacter?.bloodlineId)}
                  inputType="number"
                  onSave={updateCharacterField('bloodlineId', (value) =>
                    parseIntegerField(value, 'Bloodline ID'),
                  )}
                />
              </div>
              {isCreateMode ? (
                <div className="dashboard-profile-field">
                  <EditableField
                    label="Player ID"
                    value={formatFieldValue(activeCharacter?.playerId)}
                    placeholder="Player UUID"
                    onSave={updateCharacterField('playerId', (value) => value.trim())}
                  />
                </div>
              ) : (
                <ReadOnlyField
                  label="Player ID"
                  value={formatFieldValue(character?.playerId)}
                />
              )}
              {!isCreateMode && character?.characterId ? (
                <ReadOnlyField
                  label="Character ID"
                  value={formatFieldValue(character.characterId)}
                />
              ) : null}
              {!isCreateMode && character?.createdAt ? (
                <ReadOnlyField
                  label="Created"
                  value={formatDateToMmDdYyyy(character.createdAt)}
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
          {creating ? 'Creating…' : 'Create Character'}
        </button>
      ) : null}
    </div>
  )
}

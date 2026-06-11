import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DataTable from '../components/DataTable'
import DropdownField from '../components/DropdownField'
import EditableField from '../components/EditableField'
import { useAuth } from '../hooks/useAuth'
import {
  addCharacterSkills,
  createCharacter,
  getCharacterById,
  getCharacterSkills,
  updateCharacterColumnById,
} from '../services/characterService'
import { useReferenceDataStore } from '../stores/referenceDataStore'
import { formatDateToMmDdYyyy } from '../utils/formatDate'

const EMPTY_CHARACTER = {
  characterName: '',
  playerId: '',
  bloodlineId: '',
  xp: '0',
}

const skillPickerColumns = [
  { key: 'skillID', header: 'Skill ID' },
  { key: 'skillName', header: 'Name' },
  { key: 'skillDescription', header: 'Description' },
  { key: 'costXP', header: 'XP Cost' },
  { key: 'costWill', header: 'Will Cost' },
  { key: 'costMind', header: 'Mind Cost' },
]

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
  const [characterSkillsState, setCharacterSkillsState] = useState({
    characterId: null,
    skills: [],
    error: '',
  })
  const [showSkillPicker, setShowSkillPicker] = useState(false)
  const allSkills = useReferenceDataStore((state) => state.skills)
  const allSkillsLoading = useReferenceDataStore((state) => state.skillsLoading)
  const loadSkills = useReferenceDataStore((state) => state.loadSkills)
  const getSkillBySkillID = useReferenceDataStore((state) => state.getSkillBySkillID)
  const bloodlines = useReferenceDataStore((state) => state.bloodlines)
  const loadBloodlines = useReferenceDataStore((state) => state.loadBloodlines)
  const [addingSkill, setAddingSkill] = useState(false)

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

  useEffect(() => {
    if (authLoading || isCreateMode || !character?.characterId) {
      return undefined
    }

    const characterId = character.characterId
    let active = true

    getCharacterSkills(characterId)
      .then((data) => {
        if (active) {
          setCharacterSkillsState({
            characterId,
            skills: data,
            error: '',
          })
        }
      })
      .catch((loadError) => {
        if (active) {
          setCharacterSkillsState({
            characterId,
            skills: [],
            error: loadError.message,
          })
        }
      })

    return () => {
      active = false
    }
  }, [authLoading, isCreateMode, character?.characterId])

  const characterSkills =
    characterSkillsState.characterId === character?.characterId
      ? characterSkillsState.skills
      : []
  const skillsLoading =
    Boolean(character?.characterId) &&
    !isCreateMode &&
    characterSkillsState.characterId !== character?.characterId
  const skillsError = characterSkillsState.error

  function setSkillsError(message) {
    setCharacterSkillsState((previous) => ({
      ...previous,
      error: message,
    }))
  }

  useEffect(() => {
    if (authLoading || isCreateMode || !character?.characterId) {
      return undefined
    }

    if (!allSkills.length && !allSkillsLoading) {
      loadSkills().catch((loadError) => {
        setSkillsError(loadError.message)
      })
    }
  }, [
    authLoading,
    isCreateMode,
    character?.characterId,
    allSkills.length,
    allSkillsLoading,
    loadSkills,
  ])

  useEffect(() => {
    if (authLoading) {
      return undefined
    }

    const { bloodlines, bloodlinesLoading } = useReferenceDataStore.getState()

    if (!bloodlines.length && !bloodlinesLoading) {
      loadBloodlines().catch(() => {})
    }
  }, [authLoading, loadBloodlines])

  useEffect(() => {
    if (authLoading || !showSkillPicker || allSkills.length || allSkillsLoading) {
      return undefined
    }

    loadSkills().catch((loadError) => {
      setSkillsError(loadError.message)
    })
  }, [authLoading, showSkillPicker, allSkills.length, allSkillsLoading, loadSkills])

  async function handleAddSkill(row) {
    if (!character?.characterId || addingSkill) {
      return
    }

    const skillId = Number(row.skillID)

    if (Number.isNaN(skillId)) {
      setSkillsError('Invalid skill id')
      return
    }

    if (characterSkills.some((skill) => skill.skillId === skillId)) {
      setSkillsError('Skill is already assigned to this character.')
      return
    }

    setAddingSkill(true)
    setSkillsError('')

    try {
      const addedSkill = await addCharacterSkills(character.characterId, skillId)
      setCharacterSkillsState((previous) => ({
        ...previous,
        skills: [...previous.skills, addedSkill],
        error: '',
      }))
      setShowSkillPicker(false)
    } catch (addError) {
      setSkillsError(addError.message)
    } finally {
      setAddingSkill(false)
    }
  }

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

  function getSkillDisplayName(skillId) {
    return getSkillBySkillID(skillId)?.skillName ?? String(skillId)
  }

  const bloodlineOptions = useMemo(
    () =>
      bloodlines.map((bloodline) => ({
        value: bloodline.bloodlineID,
        label: bloodline.bloodlineName,
      })),
    [bloodlines],
  )

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
                <DropdownField
                  label="Bloodline"
                  value={formatFieldValue(activeCharacter?.bloodlineId)}
                  options={bloodlineOptions}
                  placeholder="Select bloodline"
                  editLabel="Edit bloodline"
                  onSave={updateCharacterField('bloodlineId', (value) =>
                    parseIntegerField(value, 'Bloodline'),
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

      {!authLoading && !loading && !isCreateMode && character ? (
        <section className="dashboard-section">
          <div className="character-skills-header">
            <h2 className="dashboard-section-title">Skills</h2>
            {showSkillPicker ? (
              <button
                type="button"
                className="dashboard-action-link character-skills-action"
                disabled={addingSkill}
                onClick={() => setShowSkillPicker(false)}
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                className="dashboard-action-link character-skills-action"
                onClick={() => setShowSkillPicker(true)}
              >
                Add Skill
              </button>
            )}
          </div>
          <div className="dashboard-card character-skills-card">
            {skillsError ? (
              <p className="list-page-error" role="alert">
                {skillsError}
              </p>
            ) : null}

            {showSkillPicker ? (
              allSkillsLoading || addingSkill ? (
                <p className="list-page-loading character-skills-status" role="status">
                  {addingSkill ? 'Adding skill…' : 'Loading skills…'}
                </p>
              ) : (
                <DataTable
                  data={allSkills}
                  columns={skillPickerColumns}
                  emptyMessage="No skills found."
                  onRowClick={handleAddSkill}
                />
              )
            ) : skillsLoading ? (
              <p className="list-page-loading character-skills-status" role="status">
                Loading skills…
              </p>
            ) : (
              <div className="character-skills-list">
                {characterSkills.length ? (
                  <ul className="character-skills-items">
                    {characterSkills.map((skill) => (
                      <li
                        key={`${skill.characterId}-${skill.skillId}`}
                        className="character-skills-item"
                      >
                        {getSkillDisplayName(skill.skillId)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="character-skills-empty">No skills found.</p>
                )}
              </div>
            )}
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

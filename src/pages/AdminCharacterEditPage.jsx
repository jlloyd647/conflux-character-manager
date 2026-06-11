import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import NumericField from '../components/NumericField'
import DataTable from '../components/DataTable'
import DropdownField from '../components/DropdownField'
import EditableField from '../components/EditableField'
import { useAuth } from '../hooks/useAuth'
import {
  addCharacterSkills,
  createCharacter,
  getCharacterById,
  getCharacterSkills,
  getCharacterStats,
  toPageStatValues,
  updateCharacterColumnById,
  updateCharacterStatsById,
} from '../services/characterService'
import { useReferenceDataStore } from '../stores/referenceDataStore'
import { formatDateToMmDdYyyy } from '../utils/formatDate'

const EMPTY_CHARACTER = {
  characterName: '',
  playerId: '',
  bloodlineId: '',
  kingroupId: '',
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

const CHARACTER_STAT_FIELDS = [
  { key: 'vitality', label: 'Vitality', minKey: 'minVitality', maxKey: 'maxVitality' },
  { key: 'mind', label: 'Mind', minKey: 'minMind', maxKey: 'maxMind' },
  { key: 'strength', label: 'Strength', minKey: 'minStrength', maxKey: 'maxStrength' },
  { key: 'willpower', label: 'Willpower', minKey: 'minWillpower', maxKey: 'maxWillpower' },
]

const EMPTY_STATS = {
  vitality: null,
  mind: null,
  strength: null,
  willpower: null,
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

function formatFieldValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function formatKingroupValue(kingroupId) {
  if (kingroupId === null || kingroupId === undefined || kingroupId === '') {
    return ''
  }

  return String(kingroupId)
}

function toStatNumber(value, fallback = null) {
  if (value !== null && value !== undefined && value !== '') {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

function resolveCharacterStats(source, bloodline, draft = null) {
  const pick = (key, minKey) =>
    toStatNumber(draft?.[key] ?? source?.[key], bloodline?.[minKey] ?? null)

  return {
    vitality: pick('vitality', 'minVitality'),
    mind: pick('mind', 'minMind'),
    strength: pick('strength', 'minStrength'),
    willpower: pick('willpower', 'minWillpower'),
  }
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
  const [characterStatsState, setCharacterStatsState] = useState({
    characterId: null,
    stats: null,
    error: '',
  })
  const [showSkillPicker, setShowSkillPicker] = useState(false)
  const allSkills = useReferenceDataStore((state) => state.skills)
  const allSkillsLoading = useReferenceDataStore((state) => state.skillsLoading)
  const loadSkills = useReferenceDataStore((state) => state.loadSkills)
  const getSkillBySkillID = useReferenceDataStore((state) => state.getSkillBySkillID)
  const bloodlines = useReferenceDataStore((state) => state.bloodlines)
  const loadBloodlines = useReferenceDataStore((state) => state.loadBloodlines)
  const kingroups = useReferenceDataStore((state) => state.kingroups)
  const loadKingroups = useReferenceDataStore((state) => state.loadKingroups)
  const banes = useReferenceDataStore((state) => state.banes)
  const banesLoading = useReferenceDataStore((state) => state.banesLoading)
  const loadBanes = useReferenceDataStore((state) => state.loadBanes)
  const gifts = useReferenceDataStore((state) => state.gifts)
  const giftsLoading = useReferenceDataStore((state) => state.giftsLoading)
  const loadGifts = useReferenceDataStore((state) => state.loadGifts)
  const curses = useReferenceDataStore((state) => state.curses)
  const cursesLoading = useReferenceDataStore((state) => state.cursesLoading)
  const loadCurses = useReferenceDataStore((state) => state.loadCurses)
  const [addingSkill, setAddingSkill] = useState(false)
  const [statsEditing, setStatsEditing] = useState(false)
  const [draftStats, setDraftStats] = useState(EMPTY_STATS)
  const [savingStats, setSavingStats] = useState(false)
  const [statsError, setStatsError] = useState('')

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

  useEffect(() => {
    if (authLoading || isCreateMode || !character?.characterId) {
      return undefined
    }

    const characterId = character.characterId
    let active = true

    getCharacterStats(characterId)
      .then((data) => {
        if (active) {
          setCharacterStatsState({
            characterId,
            stats: data,
            error: '',
          })
        }
      })
      .catch((loadError) => {
        if (active) {
          setCharacterStatsState({
            characterId,
            stats: null,
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
  const characterStats =
    characterStatsState.characterId === character?.characterId
      ? characterStatsState.stats
      : null
  const statsLoading =
    Boolean(character?.characterId) &&
    !isCreateMode &&
    characterStatsState.characterId !== character?.characterId

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

    const {
      bloodlines,
      bloodlinesLoading,
      kingroups,
      kingroupsLoading,
      banes,
      banesLoading,
      gifts,
      giftsLoading,
      curses,
      cursesLoading,
    } = useReferenceDataStore.getState()

    if (!bloodlines.length && !bloodlinesLoading) {
      loadBloodlines().catch(() => {})
    }

    if (!kingroups.length && !kingroupsLoading) {
      loadKingroups().catch(() => {})
    }

    if (!banes.length && !banesLoading) {
      loadBanes().catch(() => {})
    }

    if (!gifts.length && !giftsLoading) {
      loadGifts().catch(() => {})
    }

    if (!curses.length && !cursesLoading) {
      loadCurses().catch(() => {})
    }
  }, [authLoading, loadBloodlines, loadKingroups, loadBanes, loadGifts, loadCurses])

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

      const bloodlineId = parseIntegerField(draftCharacter.bloodlineId, 'Bloodline ID')
      const bloodline = bloodlines.find((entry) => entry.bloodlineID === bloodlineId) ?? null
      const stats = resolveCharacterStats(
        draftCharacter,
        bloodline,
        statsEditing ? draftStats : null,
      )

      const createdCharacter = await createCharacter({
        characterName,
        playerId,
        bloodlineId: parseIntegerField(draftCharacter.bloodlineId, 'Bloodline ID'),
        kingroupId: parseOptionalIntegerField(draftCharacter.kingroupId, 'Kin Group'),
        xp: parseIntegerField(draftCharacter.xp, 'XP'),
        stats,
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

  const kingroupOptions = useMemo(() => {
    const bloodlineId = Number(activeCharacter?.bloodlineId)

    if (!activeCharacter?.bloodlineId || Number.isNaN(bloodlineId)) {
      return []
    }

    return kingroups
      .filter((kingroup) => kingroup.bloodlineID === bloodlineId)
      .map((kingroup) => ({
        value: kingroup.kingroupID,
        label: kingroup.kingroupName,
      }))
  }, [kingroups, activeCharacter?.bloodlineId])

  const activeBloodline = useMemo(() => {
    const bloodlineId = Number(activeCharacter?.bloodlineId)

    if (!activeCharacter?.bloodlineId || Number.isNaN(bloodlineId)) {
      return null
    }

    return bloodlines.find((bloodline) => bloodline.bloodlineID === bloodlineId) ?? null
  }, [bloodlines, activeCharacter?.bloodlineId])

  const pageStatSource = useMemo(() => {
    if (isCreateMode) {
      return draftCharacter
    }

    return toPageStatValues(characterStats) ?? {}
  }, [isCreateMode, draftCharacter, characterStats])

  const currentStats = useMemo(
    () =>
      resolveCharacterStats(
        pageStatSource,
        activeBloodline,
        statsEditing ? draftStats : null,
      ),
    [pageStatSource, activeBloodline, statsEditing, draftStats],
  )

  function startStatsEditing() {
    setDraftStats(currentStats)
    setStatsError('')
    setStatsEditing(true)
  }

  function cancelStatsEditing() {
    setDraftStats(EMPTY_STATS)
    setStatsError('')
    setStatsEditing(false)
  }

  function updateDraftStat(key, value) {
    setDraftStats((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  async function confirmStatsEditing() {
    setSavingStats(true)
    setStatsError('')

    try {
      if (isCreateMode) {
        setDraftCharacter((previous) => ({
          ...previous,
          ...draftStats,
        }))
        setStatsEditing(false)
        setDraftStats(EMPTY_STATS)
        return
      }

      if (!character?.characterId) {
        throw new Error('Character not found')
      }

      const updatedStats = await updateCharacterStatsById(
        character.characterId,
        draftStats,
      )
      setCharacterStatsState({
        characterId: character.characterId,
        stats: updatedStats,
        error: '',
      })
      setStatsEditing(false)
      setDraftStats(EMPTY_STATS)
    } catch (saveError) {
      setStatsError(saveError.message)
    } finally {
      setSavingStats(false)
    }
  }

  const bloodlineBanes = useMemo(() => {
    const bloodlineId = Number(activeCharacter?.bloodlineId)

    if (!activeCharacter?.bloodlineId || Number.isNaN(bloodlineId)) {
      return []
    }

    return banes.filter((bane) => bane.bloodlineID === bloodlineId)
  }, [banes, activeCharacter?.bloodlineId])

  const bloodlineGifts = useMemo(() => {
    const bloodlineId = Number(activeCharacter?.bloodlineId)

    if (!activeCharacter?.bloodlineId || Number.isNaN(bloodlineId)) {
      return []
    }

    return gifts.filter((gift) => gift.bloodlineID === bloodlineId)
  }, [gifts, activeCharacter?.bloodlineId])

  const bloodlineCurses = useMemo(() => {
    const bloodlineId = Number(activeCharacter?.bloodlineId)

    if (!activeCharacter?.bloodlineId || Number.isNaN(bloodlineId)) {
      return []
    }

    return curses.filter((curse) => curse.bloodlineID === bloodlineId)
  }, [curses, activeCharacter?.bloodlineId])

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
            <div className="dashboard-profile-field character-edit-header">
              {!isCreateMode && character?.characterId ? (
                <span className="character-edit-header-id" style={{ fontSize: '32px' }}>
                  {character.characterId}
                  <span className="character-edit-header-separator" aria-hidden="true">
                    {' '}|{' '}
                  </span>
                </span>
              ) : null}
              <div className="character-edit-header-name">
                <EditableField
                  value={formatFieldValue(headerName)}
                  placeholder="Character name"
                  fontSizePx={32}
                  editLabel="Edit character name"
                  onSave={updateCharacterField('characterName', (value) => value.trim())}
                />
              </div>
              {isCreateMode ? (
                <>
                  <span className="character-edit-header-separator" aria-hidden="true">
                    {' '}-{' '}
                  </span>
                  <div className="character-edit-header-player">
                    <EditableField
                      value={formatFieldValue(activeCharacter?.playerId)}
                      placeholder="Player UUID"
                      fontSizePx={32}
                      editLabel="Edit player ID"
                      onSave={updateCharacterField('playerId', (value) => value.trim())}
                    />
                  </div>
                </>
              ) : (
                <span className="character-edit-header-player-id" style={{ fontSize: '32px' }}>
                  <span className="character-edit-header-separator" aria-hidden="true">
                    {' '}-{' '}
                  </span>
                  {formatFieldValue(activeCharacter?.playerId)}
                </span>
              )}
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
              <div className="dashboard-profile-field">
                <DropdownField
                  label="Kin Group"
                  value={formatKingroupValue(activeCharacter?.kingroupId)}
                  options={kingroupOptions}
                  placeholder="Select kingroup"
                  fallback="Select kingroup"
                  editLabel="Edit kin group"
                  onSave={updateCharacterField('kingroupId', (value) =>
                    parseOptionalIntegerField(value, 'Kin Group'),
                  )}
                />
              </div>
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

      {!authLoading && !loading && showForm ? (
        <section className="dashboard-section">
          <div className="character-skills-header">
            <h2 className="dashboard-section-title">Character Stats</h2>
            {statsEditing ? (
              <div className="character-skills-header-actions">
                <button
                  type="button"
                  className="dashboard-action-link character-skills-action"
                  disabled={savingStats}
                  onClick={confirmStatsEditing}
                >
                  {savingStats ? 'Saving…' : 'Confirm'}
                </button>
                <button
                  type="button"
                  className="dashboard-action-link character-skills-action"
                  disabled={savingStats}
                  onClick={cancelStatsEditing}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="dashboard-action-link character-skills-action"
                disabled={!activeBloodline || statsLoading}
                onClick={startStatsEditing}
              >
                Edit Stats
              </button>
            )}
          </div>
          <div className="dashboard-card dashboard-profile-card">
            {statsError || characterStatsState.error ? (
              <p className="list-page-error" role="alert">
                {statsError || characterStatsState.error}
              </p>
            ) : null}

            {!activeBloodline ? (
              <p className="character-skills-empty character-skills-status">
                Select a bloodline to view stats.
              </p>
            ) : statsLoading ? (
              <p className="list-page-loading character-skills-status" role="status">
                Loading stats…
              </p>
            ) : (
              <div className="dashboard-profile-grid">
                {CHARACTER_STAT_FIELDS.map((stat) => (
                  <div key={stat.key} className="dashboard-profile-field">
                    <NumericField
                      label={stat.label}
                      value={currentStats[stat.key]}
                      draftValue={draftStats[stat.key]}
                      min={activeBloodline?.[stat.minKey] ?? undefined}
                      max={activeBloodline?.[stat.maxKey] ?? undefined}
                      isEditing={statsEditing}
                      onChange={(value) => updateDraftStat(stat.key, value)}
                    />
                  </div>
                ))}
              </div>
            )}
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

      {!authLoading && !loading && showForm ? (
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Bloodline Banes</h2>
          <div className="dashboard-card character-skills-card">
            {!activeCharacter?.bloodlineId ? (
              <p className="character-skills-empty character-skills-status">
                Select a bloodline to view banes.
              </p>
            ) : banesLoading ? (
              <p className="list-page-loading character-skills-status" role="status">
                Loading banes…
              </p>
            ) : bloodlineBanes.length ? (
              <div className="character-skills-list">
                <ul className="character-skills-items">
                  {bloodlineBanes.map((bane) => (
                    <li key={bane.baneID} className="character-skills-item">
                      {bane.baneName}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="character-skills-empty character-skills-status">
                No banes found for this bloodline.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {!authLoading && !loading && showForm ? (
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Bloodline Gifts</h2>
          <div className="dashboard-card character-skills-card">
            {!activeCharacter?.bloodlineId ? (
              <p className="character-skills-empty character-skills-status">
                Select a bloodline to view gifts.
              </p>
            ) : giftsLoading ? (
              <p className="list-page-loading character-skills-status" role="status">
                Loading gifts…
              </p>
            ) : bloodlineGifts.length ? (
              <div className="character-skills-list">
                <ul className="character-skills-items">
                  {bloodlineGifts.map((gift) => (
                    <li key={gift.giftID} className="character-skills-item">
                      {gift.giftName}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="character-skills-empty character-skills-status">
                No gifts found for this bloodline.
              </p>
            )}
          </div>
        </section>
      ) : null}

      {!authLoading && !loading && showForm ? (
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Bloodline Curses</h2>
          <div className="dashboard-card character-skills-card">
            {!activeCharacter?.bloodlineId ? (
              <p className="character-skills-empty character-skills-status">
                Select a bloodline to view curses.
              </p>
            ) : cursesLoading ? (
              <p className="list-page-loading character-skills-status" role="status">
                Loading curses…
              </p>
            ) : bloodlineCurses.length ? (
              <div className="character-skills-list">
                <ul className="character-skills-items">
                  {bloodlineCurses.map((curse) => (
                    <li key={curse.curseID} className="character-skills-item">
                      {curse.curseName}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="character-skills-empty character-skills-status">
                No curses found for this bloodline.
              </p>
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

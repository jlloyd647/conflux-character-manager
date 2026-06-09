import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EditableField from '../components/EditableField'
import { useAuth } from '../hooks/useAuth'
import {
  createNewSkill,
  getSkillByID,
  updateSkillByID,
} from '../services/skillService'
import { formatDateToMmDdYyyy } from '../utils/formatDate'

const EMPTY_SKILL = {
  skillID: '',
  skillName: '',
  skillDescription: '',
  costWill: '',
  costMind: '',
  costXP: '',
}

const UPDATABLE_SKILL_FIELDS = new Set([
  'skillName',
  'skillDescription',
  'costWill',
  'costMind',
  'costXP',
])

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

function ReadOnlyField({ label, value }) {
  return (
    <div className="dashboard-profile-field">
      <dt className="dashboard-profile-label">{label}</dt>
      <dd className="dashboard-profile-value">{value || '—'}</dd>
    </div>
  )
}

export default function EditSkillPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loading: authLoading } = useAuth()
  const isCreateMode = id === 'new'
  const [skill, setSkill] = useState(null)
  const [draftSkill, setDraftSkill] = useState(EMPTY_SKILL)
  const [loading, setLoading] = useState(!isCreateMode)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (authLoading || isCreateMode) {
      return undefined
    }

    let active = true

    getSkillByID(id)
      .then((data) => {
        if (!active) {
          return
        }

        if (!data) {
          setError('Skill not found.')
          return
        }

        setSkill(data)
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

  function updateSkillField(field, parser = (value) => value) {
    return async (nextValue) => {
      const parsed = parser(nextValue)

      if (isCreateMode) {
        setDraftSkill((previous) => ({
          ...previous,
          [field]: parsed,
        }))
        return
      }

      if (!id) {
        throw new Error('Skill not found')
      }

      if (!UPDATABLE_SKILL_FIELDS.has(field)) {
        throw new Error(`Field "${field}" cannot be updated.`)
      }

      const updates = { [field]: parsed }

      console.log('[EditSkillPage] saving skill field:', {
        id,
        field,
        rawValue: nextValue,
        parsed,
        updates,
      })

      const updatedSkill = await updateSkillByID(id, updates)
      setSkill(updatedSkill)
    }
  }

  async function handleCreate() {
    setCreating(true)
    setError('')

    try {
      const skillName = String(draftSkill.skillName).trim()
      const skillDescription = String(draftSkill.skillDescription).trim()

      if (!skillName) {
        throw new Error('Name is required.')
      }

      if (!skillDescription) {
        throw new Error('Description is required.')
      }

      const createInput = {
        skillID: parseIntegerField(draftSkill.skillID, 'Skill ID'),
        skillName,
        skillDescription,
        costWill: parseOptionalIntegerField(draftSkill.costWill, 'Will Cost'),
        costMind: parseOptionalIntegerField(draftSkill.costMind, 'Mind Cost'),
        costXP: parseOptionalIntegerField(draftSkill.costXP, 'XP Cost'),
      }

      console.log('[EditSkillPage] creating skill:', {
        draftSkill,
        createInput,
      })

      const createdSkill = await createNewSkill(createInput)

      navigate(`/admin/skills/${createdSkill.id}/edit`, { replace: true })
    } catch (createError) {
      setError(createError.message)
    } finally {
      setCreating(false)
    }
  }

  const activeSkill = isCreateMode ? draftSkill : skill
  const showForm = isCreateMode || Boolean(skill)

  return (
    <div className="edit-page">
      <h1>{isCreateMode ? 'Create Skill' : 'Edit Skill'}</h1>
      <p className="edit-page-back">
        <Link to="/admin/skills">Back to Skills</Link>
      </p>

      {error ? (
        <p className="list-page-error" role="alert">
          {error}
        </p>
      ) : null}

      {authLoading || loading ? (
        <p className="list-page-loading" role="status">
          Loading skill…
        </p>
      ) : null}

      {!authLoading && !loading && showForm ? (
        <section className="dashboard-section">
          <div className="dashboard-card dashboard-profile-card">
            <div className="edit-skill-layout">
              <div className="edit-skill-main">
                <div className="edit-skill-header">
                  <div className="dashboard-profile-field edit-skill-header-field">
                    <EditableField
                      value={formatFieldValue(activeSkill?.skillName)}
                      placeholder="Skill name"
                      fontSizePx={32}
                      editLabel="Edit name"
                      onSave={updateSkillField('skillName', (value) => value.trim())}
                    />
                  </div>
                </div>
                <div className="edit-skill-description">
                  <div className="dashboard-profile-field edit-skill-description-field">
                    <EditableField
                      label="Description"
                      value={formatFieldValue(activeSkill?.skillDescription)}
                      placeholder="Skill description"
                      multiline
                      editAtLabel
                      onSave={updateSkillField('skillDescription', (value) => value.trim())}
                    />
                  </div>
                </div>
              </div>
              <div className="edit-skill-costs">
                <div className="edit-skill-fields">
                  <div className="dashboard-profile-field">
                    <EditableField
                      label="XP Cost"
                      value={formatFieldValue(activeSkill?.costXP)}
                      inputType="number"
                      onSave={updateSkillField('costXP', (value) =>
                        parseOptionalIntegerField(value, 'XP Cost'),
                      )}
                    />
                  </div>
                  <div className="dashboard-profile-field">
                    <EditableField
                      label="Will Cost"
                      value={formatFieldValue(activeSkill?.costWill)}
                      inputType="number"
                      onSave={updateSkillField('costWill', (value) =>
                        parseOptionalIntegerField(value, 'Will Cost'),
                      )}
                    />
                  </div>
                  <div className="dashboard-profile-field">
                    <EditableField
                      label="Mind Cost"
                      value={formatFieldValue(activeSkill?.costMind)}
                      inputType="number"
                      onSave={updateSkillField('costMind', (value) =>
                        parseOptionalIntegerField(value, 'Mind Cost'),
                      )}
                    />
                  </div>
                  {!isCreateMode && skill?.createdAt ? (
                    <ReadOnlyField
                      label="Created"
                      value={formatDateToMmDdYyyy(skill.createdAt)}
                    />
                  ) : null}
                  <div className="dashboard-profile-field">
                    <EditableField
                      label="Skill ID"
                      value={formatFieldValue(activeSkill?.skillID)}
                      inputType="number"
                      placeholder="Skill ID"
                      editAtLabel
                      disabled={!isCreateMode}
                      onSave={updateSkillField('skillID', (value) =>
                        parseIntegerField(value, 'Skill ID'),
                      )}
                    />
                  </div>
                </div>
              </div>
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
          {creating ? 'Creating…' : 'Create Skill'}
        </button>
      ) : null}
    </div>
  )
}

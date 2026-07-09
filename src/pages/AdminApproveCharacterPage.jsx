import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DataTable from '../components/DataTable'
import EditableField from '../components/EditableField'
import { useAuth } from '../hooks/useAuth'
import {
  approveCharacter,
  getCharacterById,
  getCharactersByPlayerId,
} from '../services/characterService'
import { getPlayerByPlayerId } from '../services/playerService'
import { useReferenceDataStore } from '../stores/referenceDataStore'
import { formatDateToMmDdYy } from '../utils/formatDate'

const playerCharacterColumns = [
  { key: 'characterId', header: 'Character ID' },
  { key: 'characterName', header: 'Name' },
  {
    key: 'approved',
    header: 'Approval Status',
    format: (approved) => (approved ? 'Approved' : 'Pending'),
  },
  {
    key: 'xp',
    header: 'XP',
    format: (value, row) => (row.approved ? value : '—'),
  },
]

function formatFieldValue(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
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

function parseIntegerField(value, label) {
  const parsed = Number.parseInt(String(value).trim(), 10)

  if (Number.isNaN(parsed)) {
    throw new Error(`${label} must be a valid number.`)
  }

  return parsed
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="dashboard-profile-field">
      <dt className="dashboard-profile-label">{label}</dt>
      <dd className="dashboard-profile-value">{value || '—'}</dd>
    </div>
  )
}

export default function AdminApproveCharacterPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { loading: authLoading } = useAuth()
  const loadBloodlines = useReferenceDataStore((state) => state.loadBloodlines)
  const loadKingroups = useReferenceDataStore((state) => state.loadKingroups)
  const getBloodlineByBloodlineID = useReferenceDataStore(
    (state) => state.getBloodlineByBloodlineID,
  )
  const getKingroupByKingroupID = useReferenceDataStore(
    (state) => state.getKingroupByKingroupID,
  )
  const bloodlines = useReferenceDataStore((state) => state.bloodlines)
  const kingroups = useReferenceDataStore((state) => state.kingroups)

  const [character, setCharacter] = useState(null)
  const [player, setPlayer] = useState(null)
  const [playerCharacters, setPlayerCharacters] = useState([])
  const [draftXp, setDraftXp] = useState('0')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [approveError, setApproveError] = useState('')
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    if (!bloodlines.length) {
      loadBloodlines().catch(() => {})
    }

    if (!kingroups.length) {
      loadKingroups().catch(() => {})
    }
  }, [bloodlines.length, kingroups.length, loadBloodlines, loadKingroups])

  useEffect(() => {
    if (authLoading) {
      return undefined
    }

    let active = true

    setLoading(true)
    setError('')

    getCharacterById(id)
      .then(async (data) => {
        if (!active) {
          return
        }

        if (!data) {
          setError('Character not found.')
          return
        }

        setCharacter(data)
        setDraftXp(String(data.xp ?? 0))

        const [playerData, characters] = await Promise.all([
          getPlayerByPlayerId(data.playerId),
          getCharactersByPlayerId(data.playerId),
        ])

        if (!active) {
          return
        }

        setPlayer(playerData)
        setPlayerCharacters(characters)
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

  const bloodlineName = useMemo(() => {
    if (!character?.bloodlineId) {
      return '—'
    }

    return getBloodlineByBloodlineID(character.bloodlineId)?.bloodlineName ?? '—'
  }, [character?.bloodlineId, getBloodlineByBloodlineID])

  const kingroupName = useMemo(() => {
    if (!character?.kingroupId) {
      return '—'
    }

    return getKingroupByKingroupID(character.kingroupId)?.kingroupName ?? '—'
  }, [character?.kingroupId, getKingroupByKingroupID])

  async function handleXpSave(nextValue) {
    const xp = parseIntegerField(nextValue, 'Starting XP')
    setDraftXp(String(xp))
  }

  async function handleApprove() {
    if (!character?.id || approving || character.approved) {
      return
    }

    setApproving(true)
    setApproveError('')

    try {
      const xp = parseIntegerField(draftXp, 'Starting XP')

      if (xp <= 0) {
        throw new Error('Starting XP must be greater than 0 before approving.')
      }

      await approveCharacter(character.id, xp)
      navigate('/admin', { replace: true })
    } catch (nextApproveError) {
      setApproveError(nextApproveError.message)
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="edit-page">
      <h1>Approve Character</h1>
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
          Loading character…
        </p>
      ) : null}

      {!authLoading && !loading && character ? (
        <>
          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Character Info</h2>
            <div className="dashboard-card dashboard-profile-card">
              <div className="dashboard-profile-grid">
                <ReadOnlyField label="Player Name" value={formatPlayerName(player)} />
                <ReadOnlyField label="Player Discord" value={player?.discordUsername} />
                <ReadOnlyField label="Player Email" value={player?.email} />
                <ReadOnlyField label="Character Name" value={character.characterName} />
                <ReadOnlyField label="Bloodline" value={bloodlineName} />
                <ReadOnlyField label="Kin Group" value={kingroupName} />
                <ReadOnlyField
                  label="Date of submission"
                  value={formatDateToMmDdYy(character.createdAt)}
                />
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Character Backstory</h2>
            <div className="dashboard-card dashboard-profile-card">
              <div className="character-approve-backstory">
                {character.backstory?.trim() ? character.backstory : '—'}
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Player&apos;s Characters</h2>
            <DataTable
              data={playerCharacters}
              columns={playerCharacterColumns}
              emptyMessage="This player has no other characters."
              link="/characters/:characterId"
              linkId="id"
            />
          </section>

          <section className="dashboard-section">
            <h2 className="dashboard-section-title">Approve</h2>

            {approveError ? (
              <p className="list-page-error" role="alert">
                {approveError}
              </p>
            ) : null}

            <div className="dashboard-card dashboard-profile-card">
              {character.approved ? (
                <p className="character-approve-status" role="status">
                  This character has already been approved.
                </p>
              ) : null}
              <div className="dashboard-profile-grid character-approve-actions">
                <div className="dashboard-profile-field">
                  <EditableField
                    label="Starting XP"
                    value={formatFieldValue(draftXp)}
                    inputType="number"
                    disabled={character.approved}
                    onSave={handleXpSave}
                  />
                </div>
              </div>
              <button
                type="button"
                className="dashboard-action-link edit-page-create-button"
                disabled={approving || character.approved}
                onClick={handleApprove}
              >
                {approving ? 'Approving…' : 'Approve Character'}
              </button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

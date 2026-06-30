import { useEffect, useMemo, useState } from 'react'
import DataTable from './DataTable'
import { useAuth } from '../hooks/useAuth'
import { getUnapprovedCharacters } from '../services/characterService'
import { getPlayersByPlayerIds } from '../services/playerService'
import { useReferenceDataStore } from '../stores/referenceDataStore'
import { formatDateToMmDdYy } from '../utils/formatDate'

const NPL_CONTACT_METHOD_LABELS = {
  1: 'Discord',
  2: 'Email',
  3: 'I do not want to meet with a Player Liason',
}

function formatNplContactMethod(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return NPL_CONTACT_METHOD_LABELS[Number(value)] ?? '—'
}

const columns = [
  { key: 'playerName', header: 'Player Name' },
  { key: 'characterName', header: 'Character Name' },
  { key: 'bloodline', header: 'Bloodline' },
  { key: 'kingroup', header: 'Kingroup' },
  {
    key: 'submittedAt',
    header: 'Date of submission',
    format: formatDateToMmDdYy,
  },
  {
    key: 'nplContactMethod',
    header: 'New Player Liason Contact Method',
    format: formatNplContactMethod,
  },
]

function formatPlayerName(player) {
  if (!player) {
    return '—'
  }

  const fullName = [player.firstName, player.lastName].filter(Boolean).join(' ')

  return fullName || '—'
}

export default function ApprovalPendingCharactersSection() {
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

  const [characters, setCharacters] = useState([])
  const [playersById, setPlayersById] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

    getUnapprovedCharacters()
      .then(async (pendingCharacters) => {
        if (!active) {
          return
        }

        const playerIds = pendingCharacters.map((character) => character.playerId)
        const players = await getPlayersByPlayerIds(playerIds)

        if (!active) {
          return
        }

        setCharacters(pendingCharacters)
        setPlayersById(
          new Map(players.map((player) => [String(player.playerId), player])),
        )
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
  }, [authLoading])

  const tableRows = useMemo(
    () =>
      characters.map((character) => {
        const bloodline =
          getBloodlineByBloodlineID(character.bloodlineId)?.bloodlineName ?? '—'
        const kingroup = character.kingroupId
          ? getKingroupByKingroupID(character.kingroupId)?.kingroupName ?? '—'
          : '—'

        return {
          id: character.id,
          playerName: formatPlayerName(
            playersById.get(String(character.playerId)),
          ),
          characterName: character.characterName,
          bloodline,
          kingroup,
          submittedAt: character.createdAt,
          nplContactMethod: character.nplContactMethod,
        }
      }),
    [
      characters,
      playersById,
      getBloodlineByBloodlineID,
      getKingroupByKingroupID,
    ],
  )

  return (
    <section className="dashboard-section">
      <h2 className="dashboard-section-title">Approval Pending Characters</h2>

      {error ? (
        <p className="dashboard-error" role="alert">
          {error}
        </p>
      ) : null}

      {authLoading || loading ? (
        <p className="dashboard-loading" role="status">
          Loading pending characters…
        </p>
      ) : (
        <DataTable
          data={tableRows}
          columns={columns}
          emptyMessage="No characters are awaiting approval."
          link="/admin/characters/:id/approve"
          linkId="id"
        />
      )}
    </section>
  )
}

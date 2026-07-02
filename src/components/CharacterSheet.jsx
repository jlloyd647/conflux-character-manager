import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import NumericField from './NumericField'
import DataTable from './DataTable'
import DropdownField from './DropdownField'
import EditableField from './EditableField'
import { useAuth } from '../hooks/useAuth'
import { useRowStatusName } from '../hooks/useRowStatusName'
import { getPlayerByUserId } from '../services/playerService'
import {
  addCharacterSkills,
  addCharacterTalent,
  applyCharacterXpSpentDelta,
  changeCharacterBloodline,
  CHARACTER_STATUS,
  createCharacter,
  getCharacterById,
  getCharacterSkills,
  getCharacterStats,
  getCharacterTalents,
  removeCharacterSkill,
  removeCharacterTalent,
  toPageStatValues,
  updateCharacterColumnById,
  updateCharacterStatsAndXpSpent,
} from '../services/characterService'
import {
  addCharacterLore,
  getCharacterLores,
  removeCharacterLore,
} from '../services/characterLoreService'
import {
  addCharacterFormat,
  getCharacterFormats,
  removeCharacterFormat,
} from '../services/characterFormatService'
import { getCharacterSkillPrereq } from '../services/characterSkillPrereqService'
import { useReferenceDataStore } from '../stores/referenceDataStore'
import {
  calculateCharacterStatsXpSpentFromPageStats,
  calculateDisplayedPageStats,
  createEmptyBucketValues,
} from '../utils/characterStatBuckets'
import { formatDateToMmDdYyyy } from '../utils/formatDate'
import { checkSkillPurchase, checkSkillRemoval, checkTalentPurchase, checkTalentRemoval } from '../utils/skillBuy'
import {
  calculateCharacterStatsXpCostChange,
  formatStatXpCostDelta,
  getCharacterStatDecreaseStep,
  getCharacterStatIncreaseStep,
} from '../utils/statProgression'
import {
  canPurchaseMoreLores,
  EDUCATION_LORE_REQUIRED_MESSAGE,
  hasEducationLoreAccess,
} from '../utils/lorePurchase'
import {
  canPurchaseMoreFormats,
  hasSpecializationFormatAccess,
  SPECIALIZATION_FORMAT_REQUIRED_MESSAGE,
} from '../utils/formatPurchase'

const EMPTY_CHARACTER = {
  characterName: '',
  playerId: '',
  bloodlineId: '',
  kingroupId: '',
  xp: '0',
}

const skillPickerColumns = [
  { key: 'skillName', header: 'Name' },
  { key: 'skillDescription', header: 'Description' },
  { key: 'costXP', header: 'XP Cost' },
  { key: 'costWill', header: 'Will Cost' },
  { key: 'costMind', header: 'Mind Cost' },
]

const SKILL_TYPE_FILTER_OPTIONS = [
  { id: 1, label: 'Melee' },
  { id: 2, label: 'Ranged' },
  { id: 3, label: 'Magic' },
  { id: 4, label: 'Crafting' },
  { id: 5, label: 'Defensive' },
  { id: 6, label: 'General' },
  { id: 7, label: 'Social' },
]

const talentPickerColumns = [
  { key: 'talentID', header: 'Talent ID' },
  { key: 'talentName', header: 'Name' },
  { key: 'talentDescription', header: 'Description' },
  { key: 'talentLevel', header: 'Level' },
  { key: 'talentXPCost', header: 'XP Cost' },
]

const lorePickerColumns = [{ key: 'loreName', header: 'Lore Name' }]

const formatPickerColumns = [{ key: 'formatName', header: 'Format Name' }]

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

function matchesSkillNameFilter(name, filter) {
  const trimmedFilter = filter.trim()

  if (!trimmedFilter) {
    return true
  }

  return String(name ?? '')
    .toLowerCase()
    .includes(trimmedFilter.toLowerCase())
}

function matchesSkillTypeFilter(skillTypeID, selectedTypes) {
  if (!selectedTypes.size) {
    return true
  }

  const normalizedTypeId = Number(skillTypeID)

  if (!Number.isFinite(normalizedTypeId)) {
    return false
  }

  return selectedTypes.has(normalizedTypeId)
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

export default function CharacterSheet({ mode = 'admin' }) {
  const params = useParams()
  const recordId = mode === 'admin' ? params.id : params.characterId
  const navigate = useNavigate()
  const { user, userType, loading: authLoading } = useAuth()
  const isPlayerMode = mode === 'player'
  const isCreateMode = !isPlayerMode && recordId === 'new'
  const [player, setPlayer] = useState(null)
  const [playerLoading, setPlayerLoading] = useState(false)
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
  const [characterSkillPrereqState, setCharacterSkillPrereqState] = useState({
    characterId: null,
    prereq: null,
    error: '',
  })
  const [characterTalentsState, setCharacterTalentsState] = useState({
    characterId: null,
    talents: [],
    error: '',
  })
  const [characterLoresState, setCharacterLoresState] = useState({
    characterId: null,
    lores: [],
    error: '',
  })
  const [characterFormatsState, setCharacterFormatsState] = useState({
    characterId: null,
    formats: [],
    error: '',
  })
  const [characterStatsState, setCharacterStatsState] = useState({
    characterId: null,
    stats: null,
    error: '',
  })
  const [showSkillPicker, setShowSkillPicker] = useState(false)
  const [showSkillRemover, setShowSkillRemover] = useState(false)
  const [showTalentPicker, setShowTalentPicker] = useState(false)
  const [showTalentRemover, setShowTalentRemover] = useState(false)
  const [showLorePicker, setShowLorePicker] = useState(false)
  const [showLoreRemover, setShowLoreRemover] = useState(false)
  const [showFormatPicker, setShowFormatPicker] = useState(false)
  const [showFormatRemover, setShowFormatRemover] = useState(false)
  const allSkills = useReferenceDataStore((state) => state.skills)
  const allSkillsLoading = useReferenceDataStore((state) => state.skillsLoading)
  const skillsLoaded = useReferenceDataStore((state) => state.skillsLoaded)
  const loadSkills = useReferenceDataStore((state) => state.loadSkills)
  const getSkillBySkillID = useReferenceDataStore((state) => state.getSkillBySkillID)
  const prereqs = useReferenceDataStore((state) => state.prereqs)
  const prereqsLoading = useReferenceDataStore((state) => state.prereqsLoading)
  const prereqsLoaded = useReferenceDataStore((state) => state.prereqsLoaded)
  const loadPrereqs = useReferenceDataStore((state) => state.loadPrereqs)
  const allTalents = useReferenceDataStore((state) => state.talents)
  const allTalentsLoading = useReferenceDataStore((state) => state.talentsLoading)
  const talentsLoaded = useReferenceDataStore((state) => state.talentsLoaded)
  const referenceTalentsError = useReferenceDataStore((state) => state.talentsError)
  const loadTalents = useReferenceDataStore((state) => state.loadTalents)
  const getTalentByTalentID = useReferenceDataStore((state) => state.getTalentByTalentID)
  const getTalentsByBloodlineID = useReferenceDataStore((state) => state.getTalentsByBloodlineID)
  const allLores = useReferenceDataStore((state) => state.lores)
  const allLoresLoading = useReferenceDataStore((state) => state.loresLoading)
  const loresLoaded = useReferenceDataStore((state) => state.loresLoaded)
  const referenceLoresError = useReferenceDataStore((state) => state.loresError)
  const loadLores = useReferenceDataStore((state) => state.loadLores)
  const getLoreByLoreID = useReferenceDataStore((state) => state.getLoreByLoreID)
  const allFormats = useReferenceDataStore((state) => state.formats)
  const allFormatsLoading = useReferenceDataStore((state) => state.formatsLoading)
  const formatsLoaded = useReferenceDataStore((state) => state.formatsLoaded)
  const referenceFormatsError = useReferenceDataStore((state) => state.formatsError)
  const loadFormats = useReferenceDataStore((state) => state.loadFormats)
  const getFormatByFormatID = useReferenceDataStore((state) => state.getFormatByFormatID)
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
  const [removingSkill, setRemovingSkill] = useState(false)
  const [addingTalent, setAddingTalent] = useState(false)
  const [removingTalent, setRemovingTalent] = useState(false)
  const [addingLore, setAddingLore] = useState(false)
  const [removingLore, setRemovingLore] = useState(false)
  const [addingFormat, setAddingFormat] = useState(false)
  const [removingFormat, setRemovingFormat] = useState(false)
  const [statsEditing, setStatsEditing] = useState(false)
  const [statsEditBase, setStatsEditBase] = useState(EMPTY_STATS)
  const [draftStats, setDraftStats] = useState(EMPTY_STATS)
  const [savingStats, setSavingStats] = useState(false)
  const [statsError, setStatsError] = useState('')
  const [skillNameFilter, setSkillNameFilter] = useState('')
  const [skillTypeFilters, setSkillTypeFilters] = useState(() => new Set())
  const statProgressions = useReferenceDataStore((state) => state.statProgressions)
  const stats = useReferenceDataStore((state) => state.stats)
  const loadStatProgressions = useReferenceDataStore((state) => state.loadStatProgressions)
  const loadStats = useReferenceDataStore((state) => state.loadStats)
  const getBloodlineByBloodlineID = useReferenceDataStore(
    (state) => state.getBloodlineByBloodlineID,
  )
  const getKingroupByKingroupID = useReferenceDataStore(
    (state) => state.getKingroupByKingroupID,
  )

  useEffect(() => {
    if (authLoading || isCreateMode) {
      return undefined
    }

    let active = true

    getCharacterById(recordId)
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
  }, [authLoading, recordId, isCreateMode])

  useEffect(() => {
    if (!isPlayerMode || authLoading || !user?.id) {
      setPlayerLoading(false)
      return undefined
    }

    let active = true

    setPlayerLoading(true)

    getPlayerByUserId(user.id)
      .then((data) => {
        if (active) {
          setPlayer(data)
        }
      })
      .catch(() => {
        if (active) {
          setPlayer(null)
        }
      })
      .finally(() => {
        if (active) {
          setPlayerLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [isPlayerMode, authLoading, user?.id])

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

    getCharacterSkillPrereq(characterId)
      .then((data) => {
        if (active) {
          setCharacterSkillPrereqState({
            characterId,
            prereq: data,
            error: '',
          })
        }
      })
      .catch((loadError) => {
        if (active) {
          setCharacterSkillPrereqState({
            characterId,
            prereq: null,
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

    getCharacterTalents(characterId)
      .then((data) => {
        if (active) {
          setCharacterTalentsState({
            characterId,
            talents: data,
            error: '',
          })
        }
      })
      .catch((loadError) => {
        if (active) {
          setCharacterTalentsState({
            characterId,
            talents: [],
            error: loadError.message,
          })
        }
      })

    return () => {
      active = false
    }
  }, [authLoading, isCreateMode, character?.characterId])

  useEffect(() => {
    if (authLoading || isCreateMode || !isPlayerMode || !character?.characterId) {
      return undefined
    }

    const characterId = character.characterId
    let active = true

    getCharacterLores(characterId)
      .then((data) => {
        if (active) {
          setCharacterLoresState({
            characterId,
            lores: data,
            error: '',
          })
        }
      })
      .catch((loadError) => {
        if (active) {
          setCharacterLoresState({
            characterId,
            lores: [],
            error: loadError.message,
          })
        }
      })

    return () => {
      active = false
    }
  }, [authLoading, isCreateMode, isPlayerMode, character?.characterId])

  useEffect(() => {
    if (authLoading || isCreateMode || !isPlayerMode || !character?.characterId) {
      return undefined
    }

    const characterId = character.characterId
    let active = true

    getCharacterFormats(characterId)
      .then((data) => {
        if (active) {
          setCharacterFormatsState({
            characterId,
            formats: data,
            error: '',
          })
        }
      })
      .catch((loadError) => {
        if (active) {
          setCharacterFormatsState({
            characterId,
            formats: [],
            error: loadError.message,
          })
        }
      })

    return () => {
      active = false
    }
  }, [authLoading, isCreateMode, isPlayerMode, character?.characterId])

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
  const characterSkillPrereq =
    characterSkillPrereqState.characterId === character?.characterId
      ? characterSkillPrereqState.prereq
      : null
  const skillsLoading =
    Boolean(character?.characterId) &&
    !isCreateMode &&
    characterSkillsState.characterId !== character?.characterId
  const skillPrereqLoading =
    Boolean(character?.characterId) &&
    !isCreateMode &&
    characterSkillPrereqState.characterId !== character?.characterId
  const skillsError = characterSkillsState.error
  const characterTalents =
    characterTalentsState.characterId === character?.characterId
      ? characterTalentsState.talents
      : []
  const talentsLoading =
    Boolean(character?.characterId) &&
    !isCreateMode &&
    characterTalentsState.characterId !== character?.characterId
  const talentsError = characterTalentsState.error
  const characterLores =
    characterLoresState.characterId === character?.characterId
      ? characterLoresState.lores
      : []
  const loresLoading =
    Boolean(character?.characterId) &&
    isPlayerMode &&
    !isCreateMode &&
    characterLoresState.characterId !== character?.characterId
  const loresError = characterLoresState.error
  const characterFormats =
    characterFormatsState.characterId === character?.characterId
      ? characterFormatsState.formats
      : []
  const formatsLoading =
    Boolean(character?.characterId) &&
    isPlayerMode &&
    !isCreateMode &&
    characterFormatsState.characterId !== character?.characterId
  const formatsError = characterFormatsState.error
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

  function setTalentsError(message) {
    setCharacterTalentsState((previous) => ({
      ...previous,
      error: message,
    }))
  }

  function setLoresError(message) {
    setCharacterLoresState((previous) => ({
      ...previous,
      error: message,
    }))
  }

  function setFormatsError(message) {
    setCharacterFormatsState((previous) => ({
      ...previous,
      error: message,
    }))
  }

  function clearSkillFilters() {
    setSkillNameFilter('')
    setSkillTypeFilters(new Set())
  }

  function cancelAllAddRemoveModes() {
    setShowSkillPicker(false)
    setShowSkillRemover(false)
    setShowTalentPicker(false)
    setShowTalentRemover(false)
    setShowLorePicker(false)
    setShowLoreRemover(false)
    setShowFormatPicker(false)
    setShowFormatRemover(false)
  }

  useEffect(() => {
    if (authLoading || isCreateMode || !character?.characterId) {
      return undefined
    }

    if (!skillsLoaded && !allSkillsLoading) {
      loadSkills().catch((loadError) => {
        setSkillsError(loadError.message)
      })
    }
  }, [
    authLoading,
    isCreateMode,
    character?.characterId,
    skillsLoaded,
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
      statProgressions,
      statProgressionsLoading,
      stats,
      statsLoading,
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

    if (!statProgressions.length && !statProgressionsLoading) {
      loadStatProgressions().catch(() => {})
    }

    if (!stats.length && !statsLoading) {
      loadStats().catch(() => {})
    }
  }, [
    authLoading,
    loadBloodlines,
    loadKingroups,
    loadBanes,
    loadGifts,
    loadCurses,
    loadStatProgressions,
    loadStats,
  ])

  useEffect(() => {
    if (
      authLoading ||
      (!showSkillPicker && !showSkillRemover) ||
      allSkillsLoading ||
      skillsLoaded
    ) {
      return undefined
    }

    loadSkills().catch((loadError) => {
      setSkillsError(loadError.message)
    })
  }, [
    authLoading,
    showSkillPicker,
    showSkillRemover,
    allSkillsLoading,
    skillsLoaded,
    loadSkills,
  ])

  useEffect(() => {
    if (
      authLoading ||
      (!showSkillPicker && !showSkillRemover) ||
      prereqsLoading ||
      prereqsLoaded
    ) {
      return undefined
    }

    loadPrereqs().catch((loadError) => {
      setSkillsError(loadError.message)
    })
  }, [
    authLoading,
    showSkillPicker,
    showSkillRemover,
    prereqsLoading,
    prereqsLoaded,
    loadPrereqs,
  ])

  useEffect(() => {
    if (
      authLoading ||
      (!showTalentPicker && !showTalentRemover && !showSkillRemover) ||
      allTalentsLoading ||
      talentsLoaded
    ) {
      return undefined
    }

    loadTalents().catch(() => {})
  }, [
    authLoading,
    showTalentPicker,
    showTalentRemover,
    showSkillRemover,
    allTalentsLoading,
    talentsLoaded,
    loadTalents,
  ])

  useEffect(() => {
    if (authLoading || !showTalentPicker || prereqsLoading || prereqsLoaded) {
      return undefined
    }

    loadPrereqs().catch((loadError) => {
      setTalentsError(loadError.message)
    })
  }, [authLoading, showTalentPicker, prereqsLoading, prereqsLoaded, loadPrereqs])

  useEffect(() => {
    if (authLoading || !showTalentRemover || prereqsLoading || prereqsLoaded) {
      return undefined
    }

    loadPrereqs().catch((loadError) => {
      setTalentsError(loadError.message)
    })
  }, [authLoading, showTalentRemover, prereqsLoading, prereqsLoaded, loadPrereqs])

  useEffect(() => {
    if (
      authLoading ||
      !isPlayerMode ||
      (!showLorePicker && !showLoreRemover) ||
      allLoresLoading ||
      loresLoaded
    ) {
      return undefined
    }

    loadLores().catch((loadError) => {
      setLoresError(loadError.message)
    })
  }, [
    authLoading,
    isPlayerMode,
    showLorePicker,
    showLoreRemover,
    allLoresLoading,
    loresLoaded,
    loadLores,
  ])

  useEffect(() => {
    if (
      authLoading ||
      !isPlayerMode ||
      (!showFormatPicker && !showFormatRemover) ||
      allFormatsLoading ||
      formatsLoaded
    ) {
      return undefined
    }

    loadFormats().catch((loadError) => {
      setFormatsError(loadError.message)
    })
  }, [
    authLoading,
    isPlayerMode,
    showFormatPicker,
    showFormatRemover,
    allFormatsLoading,
    formatsLoaded,
    loadFormats,
  ])

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

    const skill = getSkillBySkillID(skillId) ?? row

    if (!skill) {
      setSkillsError('Skill not found.')
      return
    }

    if (skillPrereqLoading) {
      setSkillsError('Loading skill prerequisites…')
      return
    }

    const purchaseCheck = checkSkillPurchase({
      character,
      skill,
      characterSkills,
      characterSkillPrereq,
      prereqs,
      xpSpent: characterStats?.statXPSpent ?? 0,
    })

    if (!purchaseCheck.valid) {
      setSkillsError(purchaseCheck.message)
      return
    }

    setAddingSkill(true)
    setSkillsError('')

    try {
      const { characterSkill, characterStats: updatedCharacterStats } =
        await addCharacterSkills(character.characterId, skillId)
      const updatedCharacterSkillPrereq = await getCharacterSkillPrereq(character.characterId)
      setCharacterStatsState((previous) => ({
        ...previous,
        characterId: character.characterId,
        stats: updatedCharacterStats,
        error: '',
      }))
      setCharacterSkillsState((previous) => ({
        ...previous,
        skills: [...previous.skills, characterSkill],
        error: '',
      }))
      setCharacterSkillPrereqState({
        characterId: character.characterId,
        prereq: updatedCharacterSkillPrereq,
        error: '',
      })
      setShowSkillPicker(false)
      clearSkillFilters()
    } catch (addError) {
      setSkillsError(addError.message)
    } finally {
      setAddingSkill(false)
    }
  }

  async function handleRemoveSkill(skill) {
    if (!character?.characterId || removingSkill) {
      return
    }

    const skillId = Number(skill.skillId)

    if (Number.isNaN(skillId)) {
      setSkillsError('Invalid skill id')
      return
    }

    if (skillPrereqLoading) {
      setSkillsError('Loading skill prerequisites…')
      return
    }

    const removalCheck = checkSkillRemoval(
      characterSkills,
      skillId,
      characterTalents,
      characterSkillPrereq,
      prereqs,
      allSkills,
      allTalents,
    )

    if (!removalCheck.valid) {
      setSkillsError(removalCheck.message)
      return
    }

    setRemovingSkill(true)
    setSkillsError('')

    try {
      const updatedCharacterStats = await removeCharacterSkill(character.characterId, skillId)
      const updatedCharacterSkillPrereq = await getCharacterSkillPrereq(character.characterId)
      setCharacterStatsState((previous) => ({
        ...previous,
        characterId: character.characterId,
        stats: updatedCharacterStats,
        error: '',
      }))
      setCharacterSkillPrereqState({
        characterId: character.characterId,
        prereq: updatedCharacterSkillPrereq,
        error: '',
      })
      setCharacterSkillsState((previous) => {
        const skills = previous.skills.filter((entry) => entry.skillId !== skillId)

        if (skills.length === 0) {
          setShowSkillRemover(false)
        }

        return {
          ...previous,
          skills,
          error: '',
        }
      })
      clearSkillFilters()
    } catch (removeError) {
      setSkillsError(removeError.message)
    } finally {
      setRemovingSkill(false)
    }
  }

  async function handleAddTalent(row) {
    if (!character?.characterId || addingTalent) {
      return
    }

    const talentId = Number(row.talentID)

    if (Number.isNaN(talentId)) {
      setTalentsError('Invalid talent id')
      return
    }

    if (characterTalents.some((talent) => talent.talentId === talentId)) {
      setTalentsError('Talent is already assigned to this character.')
      return
    }

    const talent = getTalentByTalentID(talentId) ?? row

    if (!talent) {
      setTalentsError('Talent not found.')
      return
    }

    if (skillPrereqLoading) {
      setTalentsError('Loading talent prerequisites…')
      return
    }

    const purchaseCheck = checkTalentPurchase({
      character,
      talent,
      characterSkillPrereq,
      prereqs,
      xpSpent: characterStats?.statXPSpent ?? 0,
    })

    if (!purchaseCheck.valid) {
      setTalentsError(purchaseCheck.message)
      return
    }

    setAddingTalent(true)
    setTalentsError('')

    try {
      const { characterTalent, characterStats: updatedCharacterStats } =
        await addCharacterTalent(character.characterId, talentId)
      const updatedCharacterSkillPrereq = await getCharacterSkillPrereq(
        character.characterId,
      )
      setCharacterStatsState((previous) => ({
        ...previous,
        characterId: character.characterId,
        stats: updatedCharacterStats,
        error: '',
      }))
      setCharacterTalentsState((previous) => ({
        ...previous,
        talents: [...previous.talents, characterTalent],
        error: '',
      }))
      setCharacterSkillPrereqState({
        characterId: character.characterId,
        prereq: updatedCharacterSkillPrereq,
        error: '',
      })
      setShowTalentPicker(false)
    } catch (addError) {
      setTalentsError(addError.message)
    } finally {
      setAddingTalent(false)
    }
  }

  async function handleRemoveTalent(talent) {
    if (!character?.characterId || removingTalent) {
      return
    }

    const talentId = Number(talent.talentId)

    if (Number.isNaN(talentId)) {
      setTalentsError('Invalid talent id')
      return
    }

    const talentData = getTalentByTalentID(talentId)

    if (!talentData) {
      setTalentsError('Talent not found.')
      return
    }

    if (skillPrereqLoading) {
      setTalentsError('Loading talent prerequisites…')
      return
    }

    const removalCheck = checkTalentRemoval(
      characterSkills,
      characterTalents,
      characterSkillPrereq,
      talentData,
      prereqs,
      allSkills,
      allTalents,
    )

    if (!removalCheck.valid) {
      setTalentsError(removalCheck.message)
      return
    }

    setRemovingTalent(true)
    setTalentsError('')

    try {
      const updatedCharacterStats = await removeCharacterTalent(
        character.characterId,
        talentId,
      )
      const updatedCharacterSkillPrereq = await getCharacterSkillPrereq(
        character.characterId,
      )
      setCharacterStatsState((previous) => ({
        ...previous,
        characterId: character.characterId,
        stats: updatedCharacterStats,
        error: '',
      }))
      setCharacterSkillPrereqState({
        characterId: character.characterId,
        prereq: updatedCharacterSkillPrereq,
        error: '',
      })
      setCharacterTalentsState((previous) => {
        const talents = previous.talents.filter((entry) => entry.talentId !== talentId)

        if (talents.length === 0) {
          setShowTalentRemover(false)
        }

        return {
          ...previous,
          talents,
          error: '',
        }
      })
    } catch (removeError) {
      setTalentsError(removeError.message)
    } finally {
      setRemovingTalent(false)
    }
  }

  async function handleAddLore(row) {
    if (!character?.characterId || addingLore) {
      return
    }

    const loreId = Number(row.loreID)

    if (Number.isNaN(loreId)) {
      setLoresError('Invalid lore id')
      return
    }

    if (characterLores.some((lore) => lore.loreId === loreId)) {
      setLoresError('Lore is already assigned to this character.')
      return
    }

    if (!hasEducationLoreAccess(characterSkills)) {
      setLoresError(EDUCATION_LORE_REQUIRED_MESSAGE)
      return
    }

    if (!canPurchaseMoreLores(characterSkills, characterLores)) {
      setLoresError('This character has reached their lore limit.')
      return
    }

    setAddingLore(true)
    setLoresError('')

    try {
      const characterLore = await addCharacterLore(character.characterId, loreId)
      setCharacterLoresState((previous) => ({
        ...previous,
        lores: [...previous.lores, characterLore],
        error: '',
      }))
      setShowLorePicker(false)
    } catch (addError) {
      setLoresError(addError.message)
    } finally {
      setAddingLore(false)
    }
  }

  async function handleRemoveLore(lore) {
    if (!character?.characterId || removingLore) {
      return
    }

    const loreId = Number(lore.loreId)

    if (Number.isNaN(loreId)) {
      setLoresError('Invalid lore id')
      return
    }

    setRemovingLore(true)
    setLoresError('')

    try {
      await removeCharacterLore(character.characterId, loreId)
      setCharacterLoresState((previous) => {
        const lores = previous.lores.filter((entry) => entry.loreId !== loreId)

        if (lores.length === 0) {
          setShowLoreRemover(false)
        }

        return {
          ...previous,
          lores,
          error: '',
        }
      })
    } catch (removeError) {
      setLoresError(removeError.message)
    } finally {
      setRemovingLore(false)
    }
  }

  async function handleAddFormat(row) {
    if (!character?.characterId || addingFormat) {
      return
    }

    const formatId = Number(row.formatID)

    if (Number.isNaN(formatId)) {
      setFormatsError('Invalid format id')
      return
    }

    if (characterFormats.some((format) => format.formatId === formatId)) {
      setFormatsError('Format is already assigned to this character.')
      return
    }

    if (!hasSpecializationFormatAccess(characterSkills)) {
      setFormatsError(SPECIALIZATION_FORMAT_REQUIRED_MESSAGE)
      return
    }

    if (!canPurchaseMoreFormats(characterSkills, characterFormats)) {
      setFormatsError('This character has reached their format limit.')
      return
    }

    setAddingFormat(true)
    setFormatsError('')

    try {
      const characterFormat = await addCharacterFormat(character.characterId, formatId)
      setCharacterFormatsState((previous) => ({
        ...previous,
        formats: [...previous.formats, characterFormat],
        error: '',
      }))
      setShowFormatPicker(false)
    } catch (addError) {
      setFormatsError(addError.message)
    } finally {
      setAddingFormat(false)
    }
  }

  async function handleRemoveFormat(format) {
    if (!character?.characterId || removingFormat) {
      return
    }

    const formatId = Number(format.formatId)

    if (Number.isNaN(formatId)) {
      setFormatsError('Invalid format id')
      return
    }

    setRemovingFormat(true)
    setFormatsError('')

    try {
      await removeCharacterFormat(character.characterId, formatId)
      setCharacterFormatsState((previous) => {
        const formats = previous.formats.filter((entry) => entry.formatId !== formatId)

        if (formats.length === 0) {
          setShowFormatRemover(false)
        }

        return {
          ...previous,
          formats,
          error: '',
        }
      })
    } catch (removeError) {
      setFormatsError(removeError.message)
    } finally {
      setRemovingFormat(false)
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

  async function handleBloodlineChange(nextValue) {
    const bloodlineId = parseIntegerField(nextValue, 'Bloodline')

    if (isCreateMode) {
      setDraftCharacter((previous) => ({
        ...previous,
        bloodlineId,
        kingroupId: '',
      }))
      return
    }

    if (!character?.id) {
      throw new Error('Character not found')
    }

    const { character: updatedCharacter, characterStats } = await changeCharacterBloodline(
      character.id,
      bloodlineId,
    )
    const updatedCharacterSkillPrereq = await getCharacterSkillPrereq(
      updatedCharacter.characterId,
    )

    setCharacter(updatedCharacter)
    setCharacterStatsState((previous) => ({
      ...previous,
      characterId: updatedCharacter.characterId,
      stats: characterStats,
      error: '',
    }))
    setCharacterSkillPrereqState({
      characterId: updatedCharacter.characterId,
      prereq: updatedCharacterSkillPrereq,
      error: '',
    })
    setCharacterTalentsState((previous) => ({
      ...previous,
      characterId: updatedCharacter.characterId,
      talents: [],
      error: '',
    }))
    setShowTalentPicker(false)
    setShowTalentRemover(false)
    setStatsEditing(false)
    setStatsEditBase(EMPTY_STATS)
    setDraftStats(EMPTY_STATS)
    setStatsError('')
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
      const characterStatValues = resolveCharacterStats(
        draftCharacter,
        bloodline,
        statsEditing ? draftStats : null,
      )

      const createdCharacter = await createCharacter({
        characterName,
        playerId,
        bloodlineId: parseIntegerField(draftCharacter.bloodlineId, 'Bloodline ID'),
        kingroupId: parseOptionalIntegerField(draftCharacter.kingroupId, 'Kin Group'),
        xp: parseIntegerField(draftCharacter.xp, 'Total XP'),
        stats: characterStatValues,
      })
      const baseStats = resolveCharacterStats({}, bloodline, null)
      const statXpCost = calculateCharacterStatsXpCostChange(
        baseStats,
        characterStatValues,
        statProgressions,
        stats,
      )

      if (statXpCost !== 0) {
        await applyCharacterXpSpentDelta(createdCharacter.characterId, statXpCost)
      }

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

  function toggleSkillTypeFilter(typeId) {
    setSkillTypeFilters((previous) => {
      const next = new Set(previous)

      if (next.has(typeId)) {
        next.delete(typeId)
      } else {
        next.add(typeId)
      }

      return next
    })
  }

  function getTalentDisplayName(talentId) {
    return getTalentByTalentID(talentId)?.talentName ?? String(talentId)
  }

  function getLoreDisplayName(loreId) {
    return getLoreByLoreID(loreId)?.loreName ?? String(loreId)
  }

  function getFormatDisplayName(formatId) {
    return getFormatByFormatID(formatId)?.formatName ?? String(formatId)
  }

  const bloodlineTalentOptions = useMemo(() => {
    const bloodlineId = Number(activeCharacter?.bloodlineId)

    if (!activeCharacter?.bloodlineId || Number.isNaN(bloodlineId)) {
      return []
    }

    const assignedTalentIds = new Set(characterTalents.map((talent) => talent.talentId))

    return getTalentsByBloodlineID(bloodlineId).filter(
      (talent) => !assignedTalentIds.has(talent.talentID),
    )
  }, [activeCharacter?.bloodlineId, characterTalents, getTalentsByBloodlineID])

  const availableSkillOptions = useMemo(() => {
    const assignedSkillIds = new Set(characterSkills.map((skill) => skill.skillId))

    return allSkills.filter((skill) => !assignedSkillIds.has(skill.skillID))
  }, [allSkills, characterSkills])

  const availableLoreOptions = useMemo(() => {
    const assignedLoreIds = new Set(characterLores.map((lore) => lore.loreId))

    return allLores.filter((lore) => !assignedLoreIds.has(lore.loreID))
  }, [allLores, characterLores])

  const availableFormatOptions = useMemo(() => {
    const assignedFormatIds = new Set(characterFormats.map((format) => format.formatId))

    return allFormats.filter((format) => !assignedFormatIds.has(format.formatID))
  }, [allFormats, characterFormats])

  const characterHasSpecializationFormatAccess = useMemo(
    () => hasSpecializationFormatAccess(characterSkills),
    [characterSkills],
  )

  const canAddMoreFormats = useMemo(
    () => canPurchaseMoreFormats(characterSkills, characterFormats),
    [characterSkills, characterFormats],
  )

  const characterHasEducationLoreAccess = useMemo(
    () => hasEducationLoreAccess(characterSkills),
    [characterSkills],
  )

  const canAddMoreLores = useMemo(
    () => canPurchaseMoreLores(characterSkills, characterLores),
    [characterSkills, characterLores],
  )

  const displayedCharacterSkills = useMemo(() => {
    if (!isPlayerMode) {
      return characterSkills
    }

    return characterSkills.filter((skill) => {
      const skillData = getSkillBySkillID(skill.skillId)

      return (
        matchesSkillNameFilter(skillData?.skillName ?? skill.skillId, skillNameFilter) &&
        matchesSkillTypeFilter(skillData?.skillTypeID, skillTypeFilters)
      )
    })
  }, [characterSkills, skillNameFilter, skillTypeFilters, isPlayerMode, getSkillBySkillID])

  const displayedAvailableSkillOptions = useMemo(() => {
    if (!isPlayerMode) {
      return availableSkillOptions
    }

    return availableSkillOptions.filter(
      (skill) =>
        matchesSkillNameFilter(skill.skillName, skillNameFilter) &&
        matchesSkillTypeFilter(skill.skillTypeID, skillTypeFilters),
    )
  }, [availableSkillOptions, skillNameFilter, skillTypeFilters, isPlayerMode])

  const skillFilterActive =
    isPlayerMode && (Boolean(skillNameFilter.trim()) || skillTypeFilters.size > 0)

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

    if (!characterStats) {
      return {}
    }

    if (!activeBloodline) {
      return toPageStatValues(characterStats) ?? {}
    }

    return calculateDisplayedPageStats(
      characterStats.buckets ?? createEmptyBucketValues(),
      activeBloodline,
      statProgressions,
      stats,
    )
  }, [
    isCreateMode,
    draftCharacter,
    characterStats,
    activeBloodline,
    statProgressions,
    stats,
  ])

  const currentStats = useMemo(
    () =>
      resolveCharacterStats(
        pageStatSource,
        activeBloodline,
        statsEditing ? draftStats : null,
      ),
    [pageStatSource, activeBloodline, statsEditing, draftStats],
  )

  const statsXpCostDelta = useMemo(() => {
    if (!statsEditing) {
      return 0
    }

    try {
      return calculateCharacterStatsXpCostChange(
        statsEditBase,
        draftStats,
        statProgressions,
        stats,
      )
    } catch {
      return 0
    }
  }, [statsEditing, statsEditBase, draftStats, statProgressions, stats])

  const displayedStatXpSpent = useMemo(() => {
    if (!activeBloodline) {
      return 0
    }

    try {
      return calculateCharacterStatsXpSpentFromPageStats(
        currentStats,
        activeBloodline,
        statProgressions,
        stats,
      )
    } catch {
      return 0
    }
  }, [currentStats, activeBloodline, statProgressions, stats])

  function startStatsEditing() {
    setStatsEditBase(currentStats)
    setDraftStats(currentStats)
    setStatsError('')
    setStatsEditing(true)
  }

  function cancelStatsEditing() {
    setStatsEditBase(EMPTY_STATS)
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
        setStatsEditBase(EMPTY_STATS)
        setDraftStats(EMPTY_STATS)
        return
      }

      if (!character?.characterId) {
        throw new Error('Character not found')
      }

      const xpDelta = calculateCharacterStatsXpCostChange(
        statsEditBase,
        draftStats,
        statProgressions,
        stats,
      )
      const { updatedStats } = await updateCharacterStatsAndXpSpent(
          character.characterId,
          draftStats,
          xpDelta,
          statsEditBase,
          { statProgressions, stats },
        )

      setCharacterStatsState({
        characterId: character.characterId,
        stats: updatedStats,
        error: '',
      })
      setStatsEditing(false)
      setStatsEditBase(EMPTY_STATS)
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

  const bloodlineDisplayName = useMemo(() => {
    if (!character?.bloodlineId) {
      return '—'
    }

    return getBloodlineByBloodlineID(character.bloodlineId)?.bloodlineName ?? '—'
  }, [character?.bloodlineId, getBloodlineByBloodlineID])

  const kingroupDisplayName = useMemo(() => {
    if (!character?.kingroupId) {
      return '—'
    }

    return getKingroupByKingroupID(character.kingroupId)?.kingroupName ?? '—'
  }, [character?.kingroupId, getKingroupByKingroupID])

  const characterStatusName = useRowStatusName(character?.status)

  const canReduceCharacterBuild = useMemo(() => {
    if (!isPlayerMode) {
      return true
    }

    return (
      character?.status === CHARACTER_STATUS.NEW ||
      character?.status === CHARACTER_STATUS.REROLL
    )
  }, [isPlayerMode, character?.status])

  const accessDenied =
    isPlayerMode &&
    !loading &&
    !authLoading &&
    !playerLoading &&
    character &&
    userType === 'player' &&
    (!player ||
      (String(character.playerId) !== String(player.playerId) &&
        String(character.playerId) !== String(player.id)))

  const playerAccessPending =
    isPlayerMode && userType === 'player' && (authLoading || loading || playerLoading)

  const backLink = isPlayerMode ? '/dashboard' : '/staff/characters'
  const backLabel = isPlayerMode ? 'Back to Dashboard' : 'Back to Characters'
  const pageTitle = isCreateMode
    ? 'Create Character'
    : isPlayerMode
      ? 'Character'
      : 'Edit Character'

  return (
    <div className="edit-page">
      <h1>{pageTitle}</h1>
      <p className="edit-page-back">
        <Link to={backLink}>{backLabel}</Link>
      </p>

      {error ? (
        <p className="list-page-error" role="alert">
          {error}
        </p>
      ) : null}

      {accessDenied ? (
        <p className="list-page-error" role="alert">
          You do not have access to this character.
        </p>
      ) : null}

      {authLoading || loading || playerAccessPending ? (
        <p className="list-page-loading" role="status">
          Loading character…
        </p>
      ) : null}

      {!authLoading && !loading && showForm && !accessDenied && isPlayerMode && character ? (
        <section className="dashboard-section">
          <h2 className="dashboard-section-title">Character Info</h2>
          <div className="dashboard-card dashboard-profile-card">
            <div className="dashboard-profile-grid">
              <ReadOnlyField label="Character ID" value={character.characterId} />
              <ReadOnlyField label="Name" value={character.characterName} />
              <ReadOnlyField label="Total XP" value={formatFieldValue(character.xp)} />
              <ReadOnlyField
                label="Spent XP"
                value={formatFieldValue(characterStats?.statXPSpent ?? 0)}
              />
              <ReadOnlyField label="Bloodline" value={bloodlineDisplayName} />
              <ReadOnlyField label="Kin Group" value={kingroupDisplayName} />
              <ReadOnlyField label="Status" value={characterStatusName} />
              {character.createdAt ? (
                <ReadOnlyField
                  label="Created"
                  value={formatDateToMmDdYyyy(character.createdAt)}
                />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {!authLoading && !loading && showForm && !accessDenied && !isPlayerMode ? (
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
                  label="Total XP"
                  value={formatFieldValue(activeCharacter?.xp)}
                  inputType="number"
                  onSave={updateCharacterField('xp', (value) =>
                    parseIntegerField(value, 'Total XP'),
                  )}
                />
              </div>
              <div className="dashboard-profile-field">
                <EditableField
                  label="Spent XP"
                  value={formatFieldValue(characterStats?.statXPSpent ?? 0)}
                  inputType="number"
                  disabled
                />
              </div>
              <div className="dashboard-profile-field">
                <DropdownField
                  label="Bloodline"
                  value={formatFieldValue(activeCharacter?.bloodlineId)}
                  options={bloodlineOptions}
                  placeholder="Select bloodline"
                  editLabel="Edit bloodline"
                  onSave={handleBloodlineChange}
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

      {!authLoading && !loading && showForm && !accessDenied ? (
        <section className="dashboard-section">
          <div className="character-skills-header">
            <h2 className="dashboard-section-title">Character Stats</h2>
            {statsEditing ? (
              <div className="character-skills-header-actions">
                <span className="character-stats-xp-cost" role="status">
                  Stat XP cost: {formatStatXpCostDelta(statsXpCostDelta)}
                </span>
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
                      onIncrease={(currentValue) =>
                        currentValue +
                        getCharacterStatIncreaseStep(
                          stat.key,
                          currentValue,
                          statProgressions,
                          stats,
                        )
                      }
                      onDecrease={(currentValue) =>
                        currentValue -
                        getCharacterStatDecreaseStep(
                          stat.key,
                          currentValue,
                          statProgressions,
                          stats,
                          activeBloodline?.[stat.minKey] ?? 0,
                        )
                      }
                      onChange={(value) => updateDraftStat(stat.key, value)}
                      hideDecrease={!canReduceCharacterBuild}
                    />
                  </div>
                ))}
                <div className="dashboard-profile-field">
                  <EditableField
                    label="Stat XP Spent"
                    value={formatFieldValue(displayedStatXpSpent)}
                    inputType="number"
                    disabled
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}

      {!authLoading && !loading && !isCreateMode && character && !accessDenied ? (
        <section className="dashboard-section">
          <div className="character-skills-header">
            <h2 className="dashboard-section-title">
              {isPlayerMode ? 'Character Skills' : 'Skills'}
            </h2>
            <div className="character-skills-header-actions">
              {showSkillPicker || showSkillRemover ? (
                <button
                  type="button"
                  className="dashboard-action-link character-skills-action"
                  disabled={addingSkill || removingSkill}
                  onClick={() => {
                    setShowSkillPicker(false)
                    setShowSkillRemover(false)
                  }}
                >
                  Cancel
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="dashboard-action-link character-skills-action"
                    onClick={() => {
                      cancelAllAddRemoveModes()
                      clearSkillFilters()
                      setShowSkillPicker(true)
                    }}
                  >
                    Add Skill
                  </button>
                  {canReduceCharacterBuild ? (
                    <button
                      type="button"
                      className="dashboard-action-link character-skills-action"
                      disabled={!canReduceCharacterBuild}
                      onClick={() => {
                        cancelAllAddRemoveModes()
                        clearSkillFilters()
                        setShowSkillRemover(true)
                      }}
                    >
                      Remove Skill
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </div>
          <div
            className={`dashboard-card character-skills-card${
              isPlayerMode ? ' character-skills-card--bounded' : ''
            }`}
          >
            {isPlayerMode ? (
              <div className="character-skills-filters">
                <div className="character-skills-filter-field">
                  <label htmlFor="character-skill-name-filter" className="dashboard-profile-label">
                    Filter by name
                  </label>
                  <input
                    id="character-skill-name-filter"
                    type="search"
                    className="character-skills-filter-input"
                    value={skillNameFilter}
                    onChange={(event) => setSkillNameFilter(event.target.value)}
                    placeholder="Search skills…"
                  />
                </div>
                <fieldset className="character-skills-filter-types">
                  <legend className="dashboard-profile-label">Filter by skill type</legend>
                  <div className="character-skills-filter-type-options">
                    {SKILL_TYPE_FILTER_OPTIONS.map(({ id, label }) => (
                      <label key={id} className="character-skills-filter-type-option">
                        <input
                          type="checkbox"
                          checked={skillTypeFilters.has(id)}
                          onChange={() => toggleSkillTypeFilter(id)}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            ) : null}
            <div className={isPlayerMode ? 'character-skills-scroll-body' : undefined}>
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
                  data={displayedAvailableSkillOptions}
                  columns={skillPickerColumns}
                  emptyMessage={
                    skillFilterActive
                      ? 'No skills match your filter.'
                      : 'No skills available to add.'
                  }
                  onRowClick={handleAddSkill}
                />
              )
            ) : showSkillRemover ? (
              removingSkill ? (
                <p className="list-page-loading character-skills-status" role="status">
                  Removing skill…
                </p>
              ) : skillsLoading ? (
                <p className="list-page-loading character-skills-status" role="status">
                  Loading skills…
                </p>
              ) : characterSkills.length ? (
                displayedCharacterSkills.length ? (
                  <div className="character-skills-list">
                    <ul className="character-skills-items">
                      {displayedCharacterSkills.map((skill) => (
                        <li key={`${skill.characterId}-${skill.skillId}`}>
                          <button
                            type="button"
                            className="character-skills-item character-skills-item-button"
                            disabled={removingSkill}
                            onClick={() => handleRemoveSkill(skill)}
                          >
                            {getSkillDisplayName(skill.skillId)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="character-skills-empty character-skills-status">
                    No skills match your filter.
                  </p>
                )
              ) : (
                <p className="character-skills-empty character-skills-status">
                  No skills to remove.
                </p>
              )
            ) : skillsLoading ? (
              <p className="list-page-loading character-skills-status" role="status">
                Loading skills…
              </p>
            ) : (
              <div className="character-skills-list">
                {characterSkills.length ? (
                  displayedCharacterSkills.length ? (
                    <ul className="character-skills-items">
                      {displayedCharacterSkills.map((skill) => (
                        <li
                          key={`${skill.characterId}-${skill.skillId}`}
                          className="character-skills-item"
                        >
                          {getSkillDisplayName(skill.skillId)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="character-skills-empty">No skills match your filter.</p>
                  )
                ) : (
                  <p className="character-skills-empty">No skills found.</p>
                )}
              </div>
            )}
            </div>
          </div>
        </section>
      ) : null}

      {isPlayerMode &&
      !authLoading &&
      !loading &&
      !isCreateMode &&
      character &&
      !accessDenied ? (
        <section className="dashboard-section">
          <div className="character-skills-header">
            <h2 className="dashboard-section-title">Specialization Formats</h2>
            <div className="character-skills-header-actions">
              {showFormatPicker || showFormatRemover ? (
                <button
                  type="button"
                  className="dashboard-action-link character-skills-action"
                  disabled={addingFormat || removingFormat}
                  onClick={() => {
                    setShowFormatPicker(false)
                    setShowFormatRemover(false)
                  }}
                >
                  Cancel
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="dashboard-action-link character-skills-action"
                    disabled={
                      !characterHasSpecializationFormatAccess ||
                      !canAddMoreFormats ||
                      skillsLoading ||
                      formatsLoading
                    }
                    onClick={() => {
                      cancelAllAddRemoveModes()
                      setShowFormatPicker(true)
                    }}
                  >
                    Add Format
                  </button>
                  {canReduceCharacterBuild ? (
                    <button
                      type="button"
                      className="dashboard-action-link character-skills-action"
                      disabled={
                        !characterHasSpecializationFormatAccess || !characterFormats.length
                      }
                      onClick={() => {
                        cancelAllAddRemoveModes()
                        setShowFormatRemover(true)
                      }}
                    >
                      Remove Format
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </div>
          <div className="dashboard-card character-skills-card">
            {formatsError || (showFormatPicker && referenceFormatsError) ? (
              <p className="list-page-error" role="alert">
                {formatsError || referenceFormatsError}
              </p>
            ) : null}

            {skillsLoading || formatsLoading ? (
              <p className="list-page-loading character-skills-status" role="status">
                Loading formats…
              </p>
            ) : !characterHasSpecializationFormatAccess ? (
              <p className="character-skills-empty character-skills-status character-lores-required-message">
                {SPECIALIZATION_FORMAT_REQUIRED_MESSAGE}
              </p>
            ) : showFormatPicker ? (
              allFormatsLoading || addingFormat ? (
                <p className="list-page-loading character-skills-status" role="status">
                  {addingFormat ? 'Adding format…' : 'Loading formats…'}
                </p>
              ) : (
                <DataTable
                  data={availableFormatOptions}
                  columns={formatPickerColumns}
                  emptyMessage="No formats available to add."
                  onRowClick={handleAddFormat}
                />
              )
            ) : showFormatRemover ? (
              removingFormat ? (
                <p className="list-page-loading character-skills-status" role="status">
                  Removing format…
                </p>
              ) : formatsLoading ? (
                <p className="list-page-loading character-skills-status" role="status">
                  Loading formats…
                </p>
              ) : characterFormats.length ? (
                <div className="character-skills-list">
                  <ul className="character-skills-items">
                    {characterFormats.map((format) => (
                      <li key={`${format.characterId}-${format.formatId}`}>
                        <button
                          type="button"
                          className="character-skills-item character-skills-item-button"
                          disabled={removingFormat}
                          onClick={() => handleRemoveFormat(format)}
                        >
                          {getFormatDisplayName(format.formatId)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="character-skills-empty character-skills-status">
                  No formats to remove.
                </p>
              )
            ) : (
              <div className="character-skills-list">
                {characterFormats.length ? (
                  <ul className="character-skills-items">
                    {characterFormats.map((format) => (
                      <li
                        key={`${format.characterId}-${format.formatId}`}
                        className="character-skills-item"
                      >
                        {getFormatDisplayName(format.formatId)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="character-skills-empty">No formats found.</p>
                )}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {isPlayerMode &&
      !authLoading &&
      !loading &&
      !isCreateMode &&
      character &&
      !accessDenied ? (
        <section className="dashboard-section">
          <div className="character-skills-header">
            <h2 className="dashboard-section-title">Lores</h2>
            <div className="character-skills-header-actions">
              {showLorePicker || showLoreRemover ? (
                <button
                  type="button"
                  className="dashboard-action-link character-skills-action"
                  disabled={addingLore || removingLore}
                  onClick={() => {
                    setShowLorePicker(false)
                    setShowLoreRemover(false)
                  }}
                >
                  Cancel
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="dashboard-action-link character-skills-action"
                    disabled={!characterHasEducationLoreAccess || !canAddMoreLores || skillsLoading}
                    onClick={() => {
                      cancelAllAddRemoveModes()
                      setShowLorePicker(true)
                    }}
                  >
                    Add Lore
                  </button>
                  {canReduceCharacterBuild ? (
                    <button
                      type="button"
                      className="dashboard-action-link character-skills-action"
                      disabled={!characterHasEducationLoreAccess || !characterLores.length}
                      onClick={() => {
                        cancelAllAddRemoveModes()
                        setShowLoreRemover(true)
                      }}
                    >
                      Remove Lore
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </div>
          <div className="dashboard-card character-skills-card">
            {loresError || (showLorePicker && referenceLoresError) ? (
              <p className="list-page-error" role="alert">
                {loresError || referenceLoresError}
              </p>
            ) : null}

            {skillsLoading || loresLoading ? (
              <p className="list-page-loading character-skills-status" role="status">
                Loading lores…
              </p>
            ) : !characterHasEducationLoreAccess ? (
              <p className="character-skills-empty character-skills-status character-lores-required-message">
                {EDUCATION_LORE_REQUIRED_MESSAGE}
              </p>
            ) : showLorePicker ? (
              allLoresLoading || addingLore ? (
                <p className="list-page-loading character-skills-status" role="status">
                  {addingLore ? 'Adding lore…' : 'Loading lores…'}
                </p>
              ) : (
                <DataTable
                  data={availableLoreOptions}
                  columns={lorePickerColumns}
                  emptyMessage="No lores available to add."
                  onRowClick={handleAddLore}
                />
              )
            ) : showLoreRemover ? (
              removingLore ? (
                <p className="list-page-loading character-skills-status" role="status">
                  Removing lore…
                </p>
              ) : loresLoading ? (
                <p className="list-page-loading character-skills-status" role="status">
                  Loading lores…
                </p>
              ) : characterLores.length ? (
                <div className="character-skills-list">
                  <ul className="character-skills-items">
                    {characterLores.map((lore) => (
                      <li key={`${lore.characterId}-${lore.loreId}`}>
                        <button
                          type="button"
                          className="character-skills-item character-skills-item-button"
                          disabled={removingLore}
                          onClick={() => handleRemoveLore(lore)}
                        >
                          {getLoreDisplayName(lore.loreId)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="character-skills-empty character-skills-status">
                  No lores to remove.
                </p>
              )
            ) : (
              <div className="character-skills-list">
                {characterLores.length ? (
                  <ul className="character-skills-items">
                    {characterLores.map((lore) => (
                      <li
                        key={`${lore.characterId}-${lore.loreId}`}
                        className="character-skills-item"
                      >
                        {getLoreDisplayName(lore.loreId)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="character-skills-empty">No lores found.</p>
                )}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {!authLoading && !loading && !isCreateMode && character && !accessDenied ? (
        <section className="dashboard-section">
          <div className="character-skills-header">
            <h2 className="dashboard-section-title">Bloodline Talents</h2>
            <div className="character-skills-header-actions">
              {showTalentPicker || showTalentRemover ? (
                <button
                  type="button"
                  className="dashboard-action-link character-skills-action"
                  disabled={addingTalent || removingTalent}
                  onClick={() => {
                    setShowTalentPicker(false)
                    setShowTalentRemover(false)
                  }}
                >
                  Cancel
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="dashboard-action-link character-skills-action"
                    disabled={!activeCharacter?.bloodlineId}
                    onClick={() => {
                      cancelAllAddRemoveModes()
                      setShowTalentPicker(true)
                    }}
                  >
                    Add Talent
                  </button>
                  {canReduceCharacterBuild ? (
                    <button
                      type="button"
                      className="dashboard-action-link character-skills-action"
                      onClick={() => {
                        cancelAllAddRemoveModes()
                        setShowTalentRemover(true)
                      }}
                    >
                      Remove Talent
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </div>
          <div className="dashboard-card character-skills-card">
            {talentsError || (showTalentPicker && referenceTalentsError) ? (
              <p className="list-page-error" role="alert">
                {talentsError || referenceTalentsError}
              </p>
            ) : null}

            {showTalentPicker ? (
              !activeCharacter?.bloodlineId ? (
                <p className="character-skills-empty character-skills-status">
                  Select a bloodline to add talents.
                </p>
              ) : allTalentsLoading || addingTalent ? (
                <p className="list-page-loading character-skills-status" role="status">
                  {addingTalent ? 'Adding talent…' : 'Loading talents…'}
                </p>
              ) : (
                <DataTable
                  data={bloodlineTalentOptions}
                  columns={talentPickerColumns}
                  emptyMessage="No talents found for this bloodline."
                  onRowClick={handleAddTalent}
                />
              )
            ) : showTalentRemover ? (
              removingTalent ? (
                <p className="list-page-loading character-skills-status" role="status">
                  Removing talent…
                </p>
              ) : talentsLoading ? (
                <p className="list-page-loading character-skills-status" role="status">
                  Loading talents…
                </p>
              ) : characterTalents.length ? (
                <div className="character-skills-list">
                  <ul className="character-skills-items">
                    {characterTalents.map((talent) => (
                      <li key={`${talent.characterId}-${talent.talentId}`}>
                        <button
                          type="button"
                          className="character-skills-item character-skills-item-button"
                          disabled={removingTalent}
                          onClick={() => handleRemoveTalent(talent)}
                        >
                          {getTalentDisplayName(talent.talentId)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="character-skills-empty character-skills-status">
                  No talents to remove.
                </p>
              )
            ) : talentsLoading ? (
              <p className="list-page-loading character-skills-status" role="status">
                Loading talents…
              </p>
            ) : (
              <div className="character-skills-list">
                {characterTalents.length ? (
                  <ul className="character-skills-items">
                    {characterTalents.map((talent) => (
                      <li
                        key={`${talent.characterId}-${talent.talentId}`}
                        className="character-skills-item"
                      >
                        {getTalentDisplayName(talent.talentId)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="character-skills-empty">No talents found.</p>
                )}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {!authLoading && !loading && showForm && !accessDenied ? (
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

      {!authLoading && !loading && showForm && !accessDenied ? (
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

      {!authLoading && !loading && showForm && !accessDenied ? (
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

      {isCreateMode && showForm && !accessDenied ? (
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

import {
  bucketValuesToAggregateFields,
  bucketValuesToDbPayload,
  createEmptyBucketValues,
  getCharacterStatColumnNames,
  mapRowToBucketValues,
  pageStatsToBucketPayload,
  pageStatsToInitialBucketPayload,
} from '../utils/characterStatBuckets'
import { supabase } from './supabaseClient'

const CHARACTER_COLUMNS = [
  'id',
  'character_id',
  'character_name',
  'xp',
  'player_id',
  'bloodline_id',
  'kingroup_id',
  'approved',
  'backstory',
  'npl_contact_method',
  'created_at',
].join(', ')

const CHARACTER_FIELD_TO_COLUMN = {
  characterId: 'character_id',
  characterName: 'character_name',
  playerId: 'player_id',
  xp: 'xp',
  bloodlineId: 'bloodline_id',
  kingroupId: 'kingroup_id',
  approved: 'approved',
  backstory: 'backstory',
  nplContactMethod: 'npl_contact_method',
}

const CHARACTER_STAT_COLUMNS = [
  'character_id',
  'xp_spent',
  ...getCharacterStatColumnNames(),
].join(', ')

const UPDATABLE_CHARACTER_COLUMNS = new Set(
  Object.values(CHARACTER_FIELD_TO_COLUMN).filter(
    (column) => column !== 'character_id' && column !== 'player_id',
  ),
)

const CHARACTER_SKILL_COLUMNS = [
  'character_id',
  'skill_id',
  'approved',
  'created_at',
].join(', ')

const CHARACTER_TALENT_COLUMNS = [
  'character_id',
  'talent_id',
  'approved',
  'created_at',
].join(', ')

/**
 * @typedef {{
 *   id: string,
 *   characterId: string,
 *   characterName: string,
 *   xp: number,
 *   xpSpent: number,
 *   playerId: string,
 *   bloodlineId: number,
 *   kingroupId: number | null,
 *   approved: boolean,
 *   backstory: string,
 *   nplContactMethod: number | null,
 *   createdAt: string,
 * }} Character
 */

/**
 * @typedef {{
 *   characterID: number,
 *   buckets: Record<string, number[]>,
 *   characterVitality: number | null,
 *   characterMind: number | null,
 *   characterStrength: number | null,
 *   characterWillpower: number | null,
 *   statXPSpent: number,
 * }} CharacterStats
 */

/**
 * @typedef {{
 *   characterId: number,
 *   skillId: number,
 *   approved: boolean,
 *   createdAt: string,
 * }} CharacterSkill
 */

/**
 * @typedef {{
 *   characterId: number,
 *   talentId: number,
 *   approved: boolean,
 *   createdAt: string,
 * }} CharacterTalent
 */

/** @param {Record<string, unknown> | null} row */
function mapCharacterRow(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    characterId: row.character_id != null ? String(row.character_id) : '',
    characterName: row.character_name ?? '',
    xp: row.xp ?? 0,
    xpSpent: 0,
    playerId: row.player_id != null ? String(row.player_id) : '',
    bloodlineId: row.bloodline_id ?? 0,
    kingroupId: row.kingroup_id ?? null,
    approved: row.approved ?? false,
    backstory: row.backstory ?? '',
    nplContactMethod:
      row.npl_contact_method != null ? Number(row.npl_contact_method) : null,
    createdAt: row.created_at,
  }
}

/** @param {Record<string, unknown> | null} row */
function mapCharacterStatsRow(row) {
  if (!row) {
    return null
  }

  const buckets = mapRowToBucketValues(row)
  const aggregates = bucketValuesToAggregateFields(buckets)

  return {
    characterID: row.character_id ?? 0,
    buckets,
    characterVitality: aggregates.characterVitality,
    characterMind: aggregates.characterMind,
    characterStrength: aggregates.characterStrength,
    characterWillpower: aggregates.characterWillpower,
    statXPSpent: Number(row.xp_spent ?? 0),
  }
}

/** @param {CharacterStats | null | undefined} stats */
export function toPageStatValues(stats) {
  if (!stats) {
    return null
  }

  return {
    vitality: stats.characterVitality,
    mind: stats.characterMind,
    strength: stats.characterStrength,
    willpower: stats.characterWillpower,
  }
}

/** @param {Partial<{
 *   vitality: number | null,
 *   mind: number | null,
 *   strength: number | null,
 *   willpower: number | null,
 * }>} stats */
function buildCharacterStatsCreatePayload(stats) {
  return pageStatsToInitialBucketPayload(stats)
}

/**
 * @param {Partial<{
 *   vitality: number | null,
 *   mind: number | null,
 *   strength: number | null,
 *   willpower: number | null,
 * }>} stats
 * @param {CharacterStats | null | undefined} existingStats
 * @param {Partial<Record<string, number | null | undefined>>} basePageStats
 * @param {{
 *   statProgressions?: import('../services/statProgressionService').StatProgression[],
 *   stats?: import('../services/statDefinitionService').Stat[],
 * }} [referenceData]
 */
function buildCharacterStatsUpdatePayload(
  stats,
  existingStats,
  basePageStats,
  referenceData = {},
) {
  const existingBuckets = existingStats?.buckets ?? mapRowToBucketValues(null)

  return pageStatsToBucketPayload(
    existingBuckets,
    basePageStats,
    stats,
    referenceData.statProgressions ?? [],
    referenceData.stats ?? [],
  )
}

function parseNumericCharacterId(characterId) {
  const numericCharacterId = Number(characterId)

  if (Number.isNaN(numericCharacterId)) {
    throw new Error('Invalid character id')
  }

  return numericCharacterId
}

/**
 * @param {number[]} characterIds
 * @returns {Promise<Map<number, number>>}
 */
async function fetchXpSpentByCharacterIds(characterIds) {
  if (!characterIds.length) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('character_stats')
    .select('character_id, xp_spent')
    .in('character_id', characterIds)

  if (error) {
    throw new Error(error.message)
  }

  return new Map(
    (data ?? []).map((row) => [
      Number(row.character_id),
      Number(row.xp_spent ?? 0),
    ]),
  )
}

/**
 * @param {Character | null} character
 * @param {Map<number, number>} xpSpentByCharacterId
 * @returns {Character | null}
 */
function attachXpSpentToCharacter(character, xpSpentByCharacterId) {
  if (!character) {
    return null
  }

  const numericCharacterId = parseNumericCharacterId(character.characterId)

  return {
    ...character,
    xpSpent: xpSpentByCharacterId.get(numericCharacterId) ?? 0,
  }
}

/**
 * @param {Character[]} characters
 * @returns {Promise<Character[]>}
 */
async function attachXpSpentToCharacters(characters) {
  if (!characters.length) {
    return characters
  }

  const characterIds = characters.map((character) =>
    parseNumericCharacterId(character.characterId),
  )
  const xpSpentByCharacterId = await fetchXpSpentByCharacterIds(characterIds)

  return characters.map((character) =>
    attachXpSpentToCharacter(character, xpSpentByCharacterId),
  )
}

/**
 * @param {string | number} skillId Numeric skill business id (`skills.skill_id`)
 * @returns {Promise<number>}
 */
async function getSkillXpCost(skillId) {
  const numericSkillId = Number(skillId)

  if (Number.isNaN(numericSkillId)) {
    throw new Error('Invalid skill id')
  }

  const { data, error } = await supabase
    .from('skills')
    .select('cost_xp')
    .eq('skill_id', numericSkillId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Skill not found')
  }

  const xpCost = Number(data.cost_xp ?? 0)

  return Number.isNaN(xpCost) ? 0 : xpCost
}

/**
 * @param {string | number} talentId Numeric talent business id (`talents.talent_id`)
 * @returns {Promise<number>}
 */
async function getTalentXpCost(talentId) {
  const numericTalentId = Number(talentId)

  if (Number.isNaN(numericTalentId)) {
    throw new Error('Invalid talent id')
  }

  const { data, error } = await supabase
    .from('talents')
    .select('xp_cost')
    .eq('talent_id', numericTalentId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('Talent not found')
  }

  const xpCost = Number(data.xp_cost ?? 0)

  return Number.isNaN(xpCost) ? 0 : xpCost
}

/**
 * @param {number} characterId Numeric character business id (`characters.character_id`)
 * @param {number} delta Amount to add to `character_stats.xp_spent` (negative to subtract)
 * @returns {Promise<CharacterStats>}
 */
async function adjustCharacterXpSpent(characterId, delta) {
  const numericCharacterId = parseNumericCharacterId(characterId)
  const existingStats = await getCharacterStats(characterId)
  const currentXpSpent = existingStats?.statXPSpent ?? 0
  const newXpSpent = Math.max(0, currentXpSpent + delta)

  if (!existingStats) {
    const { data, error } = await supabase
      .from('character_stats')
      .insert({
        character_id: numericCharacterId,
        xp_spent: newXpSpent,
        ...bucketValuesToDbPayload(createEmptyBucketValues()),
      })
      .select(CHARACTER_STAT_COLUMNS)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    const characterStats = mapCharacterStatsRow(data)

    if (!characterStats) {
      throw new Error('Character stats not found')
    }

    return characterStats
  }

  const { data, error } = await supabase
    .from('character_stats')
    .update({ xp_spent: newXpSpent })
    .eq('character_id', numericCharacterId)
    .select(CHARACTER_STAT_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const characterStats = mapCharacterStatsRow(data)

  if (!characterStats) {
    throw new Error('Character stats not found')
  }

  return characterStats
}

/** @param {Record<string, unknown> | null} row */
function mapCharacterSkillRow(row) {
  if (!row) {
    return null
  }

  return {
    characterId: row.character_id ?? 0,
    skillId: row.skill_id ?? 0,
    approved: row.approved ?? false,
    createdAt: row.created_at,
  }
}

/** @param {Record<string, unknown> | null} row */
function mapCharacterTalentRow(row) {
  if (!row) {
    return null
  }

  return {
    characterId: row.character_id ?? 0,
    talentId: row.talent_id ?? 0,
    approved: row.approved ?? false,
    createdAt: row.created_at,
  }
}

export async function listCharacters() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('characters')
    .select('id, character_id, character_name, player_id, xp, bloodline_id, kingroup_id, approved, backstory, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

/**
 * @param {string} characterId
 * @returns {Promise<Character | null>}
 */
export async function getCharacterById(characterId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('characters')
    .select(CHARACTER_COLUMNS)
    .eq('id', characterId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  const character = mapCharacterRow(data)

  if (!character) {
    return null
  }

  const xpSpentByCharacterId = await fetchXpSpentByCharacterIds([
    parseNumericCharacterId(character.characterId),
  ])

  return attachXpSpentToCharacter(character, xpSpentByCharacterId)
}

/**
 * @returns {Promise<Character[]>}
 */
export async function getUnapprovedCharacters() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('characters')
    .select(CHARACTER_COLUMNS)
    .eq('approved', false)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapCharacterRow).filter(Boolean)
}

/**
 * @param {string} playerId
 * @returns {Promise<Character[]>}
 */
export async function getCharactersByPlayerId(playerId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('characters')
    .select(CHARACTER_COLUMNS)
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const characters = (data ?? []).map(mapCharacterRow).filter(Boolean)

  return attachXpSpentToCharacters(characters)
}

/**
 * @param {{
 *   characterName: string,
 *   playerId: string,
 *   bloodlineId: number,
 *   kingroupId?: number | null,
 *   xp?: number,
 *   backstory?: string,
 *   nplContactMethod?: number | null,
 *   stats?: Partial<{
 *     vitality: number | null,
 *     mind: number | null,
 *     strength: number | null,
 *     willpower: number | null,
 *   }>,
 * }} input
 * @returns {Promise<Character>}
 */
export async function createCharacter({
  characterName,
  playerId,
  bloodlineId,
  kingroupId = null,
  xp = 0,
  backstory = '',
  nplContactMethod = null,
  stats,
}) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('characters')
    .insert({
      character_name: characterName,
      player_id: playerId,
      bloodline_id: bloodlineId,
      kingroup_id: kingroupId,
      xp,
      approved: false,
      backstory,
      npl_contact_method: nplContactMethod,
    })
    .select(CHARACTER_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const character = mapCharacterRow(data)

  if (!character) {
    throw new Error('Character not found')
  }

  if (stats && Object.keys(buildCharacterStatsCreatePayload(stats)).length) {
    await createCharacterStats(character.characterId, stats)
  }

  const xpSpentByCharacterId = await fetchXpSpentByCharacterIds([
    parseNumericCharacterId(character.characterId),
  ])

  return attachXpSpentToCharacter(character, xpSpentByCharacterId)
}

/**
 * @param {string} characterId Character record id (`characters.id`)
 * @param {number} xp Total XP to assign on approval
 * @returns {Promise<Character>}
 */
export async function approveCharacter(characterId, xp) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('characters')
    .update({
      approved: true,
      xp,
    })
    .eq('id', characterId)
    .select(CHARACTER_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const character = mapCharacterRow(data)

  if (!character) {
    throw new Error('Character not found')
  }

  const xpSpentByCharacterId = await fetchXpSpentByCharacterIds([
    parseNumericCharacterId(character.characterId),
  ])

  return attachXpSpentToCharacter(character, xpSpentByCharacterId)
}

/**
 * @param {string} characterId
 * @param {string} column App field name (e.g. characterName) or database column (e.g. character_name)
 * @param {string | number | null} value
 * @returns {Promise<Character>}
 */
export async function updateCharacterColumnById(characterId, column, value) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const dbColumn = CHARACTER_FIELD_TO_COLUMN[column] ?? column

  if (!UPDATABLE_CHARACTER_COLUMNS.has(dbColumn)) {
    throw new Error(`Column "${column}" is not updatable`)
  }

  const { data, error } = await supabase
    .from('characters')
    .update({ [dbColumn]: value })
    .eq('id', characterId)
    .select(CHARACTER_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const character = mapCharacterRow(data)

  if (!character) {
    throw new Error('Character not found')
  }

  const xpSpentByCharacterId = await fetchXpSpentByCharacterIds([
    parseNumericCharacterId(character.characterId),
  ])

  return attachXpSpentToCharacter(character, xpSpentByCharacterId)
}

/**
 * @param {string} characterId Character record id (`characters.id`)
 * @param {number} bloodlineId New bloodline id (`characters.bloodline_id`)
 * @returns {Promise<{ character: Character, characterStats: CharacterStats | null }>}
 */
export async function changeCharacterBloodline(characterId, bloodlineId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('characters')
    .update({
      bloodline_id: bloodlineId,
      kingroup_id: null,
    })
    .eq('id', characterId)
    .select(CHARACTER_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const character = mapCharacterRow(data)

  if (!character) {
    throw new Error('Character not found')
  }

  const { error: resetError } = await supabase.rpc(
    'reset_character_stats_for_bloodline_change',
    {
      p_character_id: parseNumericCharacterId(character.characterId),
    },
  )

  if (resetError) {
    throw new Error(resetError.message)
  }

  const characterStats = await getCharacterStats(character.characterId)
  const characterWithXpSpent = attachXpSpentToCharacter(
    character,
    new Map([
      [
        parseNumericCharacterId(character.characterId),
        characterStats?.statXPSpent ?? 0,
      ],
    ]),
  )

  return { character: characterWithXpSpent, characterStats }
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @returns {Promise<CharacterStats | null>}
 */
export async function getCharacterStats(characterId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const numericCharacterId = parseNumericCharacterId(characterId)

  const { data, error } = await supabase
    .from('character_stats')
    .select(CHARACTER_STAT_COLUMNS)
    .eq('character_id', numericCharacterId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return mapCharacterStatsRow(data)
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @param {Partial<{
 *   vitality: number | null,
 *   mind: number | null,
 *   strength: number | null,
 *   willpower: number | null,
 * }>} stats
 * @returns {Promise<CharacterStats>}
 */
export async function createCharacterStats(characterId, stats) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const numericCharacterId = parseNumericCharacterId(characterId)
  const payload = buildCharacterStatsCreatePayload(stats)

  if (!Object.keys(payload).length) {
    throw new Error('No stats provided to create.')
  }

  const existingStats = await getCharacterStats(characterId)
  const statsPayload = {
    xp_spent: 0,
    ...payload,
  }

  const { data, error } = existingStats
    ? await supabase
        .from('character_stats')
        .update(statsPayload)
        .eq('character_id', numericCharacterId)
        .select(CHARACTER_STAT_COLUMNS)
        .single()
    : await supabase
        .from('character_stats')
        .insert({
          character_id: numericCharacterId,
          ...statsPayload,
        })
        .select(CHARACTER_STAT_COLUMNS)
        .single()

  if (error) {
    throw new Error(error.message)
  }

  const characterStats = mapCharacterStatsRow(data)

  if (!characterStats) {
    throw new Error('Character stats not found')
  }

  return characterStats
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @param {Partial<{
 *   vitality: number | null,
 *   mind: number | null,
 *   strength: number | null,
 *   willpower: number | null,
 * }>} stats
 * @param {Partial<Record<string, number | null | undefined>>} [basePageStats]
 * @param {{
 *   statProgressions?: import('../services/statProgressionService').StatProgression[],
 *   stats?: import('../services/statDefinitionService').Stat[],
 * }} [referenceData]
 * @returns {Promise<CharacterStats>}
 */
export async function updateCharacterStatsById(
  characterId,
  stats,
  basePageStats = {},
  referenceData = {},
  xpDelta = 0,
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const numericCharacterId = parseNumericCharacterId(characterId)
  const existingStats = await getCharacterStats(characterId)
  const payload = buildCharacterStatsUpdatePayload(
    stats,
    existingStats,
    basePageStats,
    referenceData,
  )

  if (!Object.keys(payload).length && xpDelta === 0) {
    throw new Error('No stats provided to update.')
  }

  if (xpDelta !== 0) {
    payload.xp_spent = Math.max(0, (existingStats?.statXPSpent ?? 0) + xpDelta)
  }

  const { data, error } = await supabase
    .from('character_stats')
    .update(payload)
    .eq('character_id', numericCharacterId)
    .select(CHARACTER_STAT_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const characterStats = mapCharacterStatsRow(data)

  if (!characterStats) {
    throw new Error('Character stats not found')
  }

  return characterStats
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @param {Partial<{
 *   vitality: number | null,
 *   mind: number | null,
 *   strength: number | null,
 *   willpower: number | null,
 * }>} stats
 * @param {number} xpDelta Amount to add to `xp_spent` (negative to subtract)
 * @param {Partial<Record<string, number | null | undefined>>} [basePageStats]
 * @param {{
 *   statProgressions?: import('../services/statProgressionService').StatProgression[],
 *   stats?: import('../services/statDefinitionService').Stat[],
 * }} [referenceData]
 * @returns {Promise<{ updatedStats: CharacterStats }>}
 */
export async function updateCharacterStatsAndXpSpent(
  characterId,
  stats,
  xpDelta,
  basePageStats = {},
  referenceData = {},
) {
  const updatedStats = await updateCharacterStatsById(
    characterId,
    stats,
    basePageStats,
    referenceData,
    xpDelta,
  )

  return { updatedStats }
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @param {number} delta Amount to add to `xp_spent` (negative to subtract)
 * @returns {Promise<CharacterStats>}
 */
export async function applyCharacterXpSpentDelta(characterId, delta) {
  return adjustCharacterXpSpent(characterId, delta)
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @returns {Promise<CharacterSkill[]>}
 */
export async function getCharacterSkills(characterId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const numericCharacterId = Number(characterId)

  if (Number.isNaN(numericCharacterId)) {
    throw new Error('Invalid character id')
  }

  const { data, error } = await supabase
    .from('character-skill')
    .select(CHARACTER_SKILL_COLUMNS)
    .eq('character_id', numericCharacterId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapCharacterSkillRow).filter(Boolean)
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @param {string | number} skillId Numeric skill business id (`skills.skill_id`)
 * @returns {Promise<{ characterSkill: CharacterSkill, characterStats: CharacterStats }>}
 */
export async function addCharacterSkills(characterId, skillId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const numericCharacterId = Number(characterId)
  const numericSkillId = Number(skillId)

  if (Number.isNaN(numericCharacterId)) {
    throw new Error('Invalid character id')
  }

  if (Number.isNaN(numericSkillId)) {
    throw new Error('Invalid skill id')
  }

  const { data, error } = await supabase
    .from('character-skill')
    .insert({
      character_id: numericCharacterId,
      skill_id: numericSkillId,
    })
    .select(CHARACTER_SKILL_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const characterSkill = mapCharacterSkillRow(data)

  if (!characterSkill) {
    throw new Error('Character skill not found')
  }

  const xpCost = await getSkillXpCost(numericSkillId)
  const characterStats = await adjustCharacterXpSpent(numericCharacterId, xpCost)

  return { characterSkill, characterStats }
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @param {string | number} skillId Numeric skill business id (`skills.skill_id`)
 * @returns {Promise<CharacterStats>}
 */
export async function removeCharacterSkill(characterId, skillId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const numericCharacterId = Number(characterId)
  const numericSkillId = Number(skillId)

  if (Number.isNaN(numericCharacterId)) {
    throw new Error('Invalid character id')
  }

  if (Number.isNaN(numericSkillId)) {
    throw new Error('Invalid skill id')
  }

  const xpCost = await getSkillXpCost(numericSkillId)

  const { error } = await supabase
    .from('character-skill')
    .delete()
    .eq('character_id', numericCharacterId)
    .eq('skill_id', numericSkillId)

  if (error) {
    throw new Error(error.message)
  }

  return adjustCharacterXpSpent(numericCharacterId, -xpCost)
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @returns {Promise<CharacterTalent[]>}
 */
export async function getCharacterTalents(characterId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const numericCharacterId = Number(characterId)

  if (Number.isNaN(numericCharacterId)) {
    throw new Error('Invalid character id')
  }

  const { data, error } = await supabase
    .from('character_talent')
    .select(CHARACTER_TALENT_COLUMNS)
    .eq('character_id', numericCharacterId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapCharacterTalentRow).filter(Boolean)
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @param {string | number} talentId Numeric talent business id (`talents.talent_id`)
 * @returns {Promise<{ characterTalent: CharacterTalent, characterStats: CharacterStats }>}
 */
export async function addCharacterTalent(characterId, talentId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const numericCharacterId = Number(characterId)
  const numericTalentId = Number(talentId)

  if (Number.isNaN(numericCharacterId)) {
    throw new Error('Invalid character id')
  }

  if (Number.isNaN(numericTalentId)) {
    throw new Error('Invalid talent id')
  }

  const xpCost = await getTalentXpCost(numericTalentId)

  const { data, error } = await supabase
    .from('character_talent')
    .insert({
      character_id: numericCharacterId,
      talent_id: numericTalentId,
    })
    .select(CHARACTER_TALENT_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const characterTalent = mapCharacterTalentRow(data)

  if (!characterTalent) {
    throw new Error('Character talent not found')
  }

  const characterStats = await adjustCharacterXpSpent(numericCharacterId, xpCost)

  return { characterTalent, characterStats }
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @param {string | number} talentId Numeric talent business id (`talents.talent_id`)
 * @returns {Promise<CharacterStats>}
 */
export async function removeCharacterTalent(characterId, talentId) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    throw new Error(authError.message)
  }

  if (!user) {
    throw new Error('Not authenticated')
  }

  const numericCharacterId = Number(characterId)
  const numericTalentId = Number(talentId)

  if (Number.isNaN(numericCharacterId)) {
    throw new Error('Invalid character id')
  }

  if (Number.isNaN(numericTalentId)) {
    throw new Error('Invalid talent id')
  }

  const xpCost = await getTalentXpCost(numericTalentId)

  const { error } = await supabase
    .from('character_talent')
    .delete()
    .eq('character_id', numericCharacterId)
    .eq('talent_id', numericTalentId)

  if (error) {
    throw new Error(error.message)
  }

  return adjustCharacterXpSpent(numericCharacterId, -xpCost)
}

import { supabase } from './supabaseClient'

const CHARACTER_COLUMNS = [
  'id',
  'character_id',
  'character_name',
  'xp',
  'player_id',
  'bloodline_id',
  'kingroup_id',
  'created_at',
].join(', ')

const CHARACTER_FIELD_TO_COLUMN = {
  characterId: 'character_id',
  characterName: 'character_name',
  playerId: 'player_id',
  xp: 'xp',
  bloodlineId: 'bloodline_id',
  kingroupId: 'kingroup_id',
}

const CHARACTER_STAT_COLUMNS = [
  'character_id',
  'vitality',
  'mind',
  'strength',
  'willpower',
].join(', ')

const PAGE_STAT_TO_DB = {
  vitality: 'vitality',
  mind: 'mind',
  strength: 'strength',
  willpower: 'willpower',
}

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

/**
 * @typedef {{
 *   id: string,
 *   characterId: string,
 *   characterName: string,
 *   xp: number,
 *   playerId: string,
 *   bloodlineId: number,
 *   kingroupId: number | null,
 *   createdAt: string,
 * }} Character
 */

/**
 * @typedef {{
 *   characterID: number,
 *   characterVitality: number | null,
 *   characterMind: number | null,
 *   characterStrength: number | null,
 *   characterWillpower: number | null,
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

/** @param {unknown} value */
function mapNumericField(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

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
    playerId: row.player_id,
    bloodlineId: row.bloodline_id ?? 0,
    kingroupId: row.kingroup_id ?? null,
    createdAt: row.created_at,
  }
}

/** @param {Record<string, unknown> | null} row */
function mapCharacterStatsRow(row) {
  if (!row) {
    return null
  }

  return {
    characterID: row.character_id ?? 0,
    characterVitality: mapNumericField(row.vitality),
    characterMind: mapNumericField(row.mind),
    characterStrength: mapNumericField(row.strength),
    characterWillpower: mapNumericField(row.willpower),
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
function buildCharacterStatsPayload(stats) {
  const payload = {}

  for (const [pageKey, dbKey] of Object.entries(PAGE_STAT_TO_DB)) {
    if (stats[pageKey] !== undefined) {
      payload[dbKey] = stats[pageKey]
    }
  }

  return payload
}

function parseNumericCharacterId(characterId) {
  const numericCharacterId = Number(characterId)

  if (Number.isNaN(numericCharacterId)) {
    throw new Error('Invalid character id')
  }

  return numericCharacterId
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
    .select('id, character_id, character_name, player_id, xp, bloodline_id, kingroup_id, created_at')
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

  return mapCharacterRow(data)
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

  return (data ?? []).map(mapCharacterRow).filter(Boolean)
}

/**
 * @param {{
 *   characterName: string,
 *   playerId: string,
 *   bloodlineId: number,
 *   kingroupId?: number | null,
 *   xp?: number,
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

  if (stats && Object.keys(buildCharacterStatsPayload(stats)).length) {
    await createCharacterStats(character.characterId, stats)
  }

  return character
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

  return character
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
  const payload = buildCharacterStatsPayload(stats)

  if (!Object.keys(payload).length) {
    throw new Error('No stats provided to create.')
  }

  const { data, error } = await supabase
    .from('character_stats')
    .insert({
      character_id: numericCharacterId,
      ...payload,
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
 * @returns {Promise<CharacterStats>}
 */
export async function updateCharacterStatsById(characterId, stats) {
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
  const payload = buildCharacterStatsPayload(stats)

  if (!Object.keys(payload).length) {
    throw new Error('No stats provided to update.')
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
 * @returns {Promise<CharacterSkill>}
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

  return characterSkill
}

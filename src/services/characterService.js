import { supabase } from './supabaseClient'

const CHARACTER_COLUMNS = [
  'id',
  'character_id',
  'character_name',
  'xp',
  'player_id',
  'bloodline_id',
  'created_at',
].join(', ')

const CHARACTER_FIELD_TO_COLUMN = {
  characterId: 'character_id',
  characterName: 'character_name',
  playerId: 'player_id',
  xp: 'xp',
  bloodlineId: 'bloodline_id',
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
 *   createdAt: string,
 * }} Character
 */

/**
 * @typedef {{
 *   characterId: number,
 *   skillId: number,
 *   approved: boolean,
 *   createdAt: string,
 * }} CharacterSkill
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
    playerId: row.player_id,
    bloodlineId: row.bloodline_id ?? 0,
    createdAt: row.created_at,
  }
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
    .select('id, character_id, character_name, player_id, xp, bloodline_id, created_at')
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
 *   xp?: number,
 * }} input
 * @returns {Promise<Character>}
 */
export async function createCharacter({ characterName, playerId, bloodlineId, xp = 0 }) {
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

  return character
}

/**
 * @param {string} characterId
 * @param {string} column App field name (e.g. characterName) or database column (e.g. character_name)
 * @param {string | number} value
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

import {
  bucketValuesToAggregateFields,
  bucketValuesToDbPayload,
  CHARACTER_STAT_BUCKET_KEYS,
  createEmptyBucketValues,
  getCharacterStatColumnNames,
  mapRowToBucketValues,
} from '../utils/characterStatBuckets'
import { supabase } from './supabaseClient'

const CHARACTER_STAT_COLUMNS = ['character_id', ...getCharacterStatColumnNames()].join(', ')
const RANK_COLUMNS = getCharacterStatColumnNames()

/**
 * @typedef {import('./characterService').CharacterStats} CharacterStats
 */

/** @param {string | number} characterId */
function parseNumericCharacterId(characterId) {
  const numericCharacterId = Number(characterId)

  if (Number.isNaN(numericCharacterId)) {
    throw new Error('Invalid character id')
  }

  return numericCharacterId
}

/** @param {string | number} rankId */
function resolveRankColumn(rankId) {
  const index = Number(rankId) - 1

  if (!Number.isInteger(index) || index < 0 || index >= RANK_COLUMNS.length) {
    throw new Error('Invalid rank id')
  }

  return RANK_COLUMNS[index]
}

/** @param {unknown} value */
function toRankValue(value) {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

/** @param {Record<string, number[]>} buckets */
function getRankValueFromBuckets(buckets, rankColumn) {
  for (const statKey of Object.keys(CHARACTER_STAT_BUCKET_KEYS)) {
    const columns = CHARACTER_STAT_BUCKET_KEYS[statKey]
    const index = columns.indexOf(rankColumn)

    if (index >= 0) {
      return toRankValue(buckets[statKey]?.[index])
    }
  }

  throw new Error('Invalid rank id')
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
  }
}

async function requireAuthenticatedUser() {
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

  return user
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @returns {Promise<CharacterStats | null>}
 */
export async function getStatsByID(characterId) {
  await requireAuthenticatedUser()

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
 * @param {string | number} rankId 1-based index into the character stat rank columns
 * @param {number} delta
 * @returns {Promise<CharacterStats>}
 */
async function updateRankByDelta(characterId, rankId, delta) {
  await requireAuthenticatedUser()

  const numericCharacterId = parseNumericCharacterId(characterId)
  const rankColumn = resolveRankColumn(rankId)
  const existingStats = await getStatsByID(characterId)

  if (!existingStats) {
    throw new Error('Character stats not found')
  }

  const currentValue = getRankValueFromBuckets(existingStats.buckets, rankColumn)
  const nextValue = delta > 0 ? currentValue + delta : Math.max(0, currentValue + delta)

  const { data, error } = await supabase
    .from('character_stats')
    .update({
      [rankColumn]: nextValue,
    })
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
 * @param {string | number} rankId 1-based index into the character stat rank columns
 * @returns {Promise<CharacterStats>}
 */
export async function addRank(characterId, rankId) {
  return updateRankByDelta(characterId, rankId, 1)
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @param {string | number} rankId 1-based index into the character stat rank columns
 * @returns {Promise<CharacterStats>}
 */
export async function removeRank(characterId, rankId) {
  return updateRankByDelta(characterId, rankId, -1)
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @returns {Promise<CharacterStats>}
 */
export async function clearAllRanks(characterId) {
  await requireAuthenticatedUser()

  const numericCharacterId = parseNumericCharacterId(characterId)
  const existingStats = await getStatsByID(characterId)

  if (!existingStats) {
    throw new Error('Character stats not found')
  }

  const { data, error } = await supabase
    .from('character_stats')
    .update(bucketValuesToDbPayload(createEmptyBucketValues()))
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

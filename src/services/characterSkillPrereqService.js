import { supabase } from './supabaseClient'

const CHARACTER_SKILL_PREREQ_COLUMNS = [
  'character_id',
  'talent_r1',
  'talent_r2',
  'talent_r3',
  'social_r1',
  'social_r2',
  'social_r3',
].join(', ')

/**
 * @typedef {{
 *   characterID: number,
 *   skillPrereqTalentR1: number,
 *   skillPrereqTalentR2: number,
 *   skillPrereqTalentR3: number,
 *   skillPrereqSocialR1: number,
 *   skillPrereqSocialR2: number,
 *   skillPrereqSocialR3: number,
 * }} CharacterSkillPrereq
 */

/** @param {number} characterId */
export function createEmptyCharacterSkillPrereq(characterId) {
  return {
    characterID: characterId,
    skillPrereqTalentR1: 0,
    skillPrereqTalentR2: 0,
    skillPrereqTalentR3: 0,
    skillPrereqSocialR1: 0,
    skillPrereqSocialR2: 0,
    skillPrereqSocialR3: 0,
  }
}

/** @param {unknown} value */
function mapNumericField(value) {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

/** @param {Record<string, unknown> | null} row */
function mapCharacterSkillPrereqRow(row) {
  if (!row) {
    return null
  }

  return {
    characterID: row.character_id ?? 0,
    skillPrereqTalentR1: mapNumericField(row.talent_r1),
    skillPrereqTalentR2: mapNumericField(row.talent_r2),
    skillPrereqTalentR3: mapNumericField(row.talent_r3),
    skillPrereqSocialR1: mapNumericField(row.social_r1),
    skillPrereqSocialR2: mapNumericField(row.social_r2),
    skillPrereqSocialR3: mapNumericField(row.social_r3),
  }
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @returns {Promise<CharacterSkillPrereq>}
 */
export async function getCharacterSkillPrereq(characterId) {
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
    .from('character_skill_prereq')
    .select(CHARACTER_SKILL_PREREQ_COLUMNS)
    .eq('character_id', numericCharacterId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  console.log(data)
  return mapCharacterSkillPrereqRow(data) ?? createEmptyCharacterSkillPrereq(numericCharacterId)
}

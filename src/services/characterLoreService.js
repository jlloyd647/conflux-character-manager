import { supabase } from './supabaseClient'

const CHARACTER_LORE_COLUMNS = ['character_id', 'lore_id'].join(', ')

/**
 * @typedef {{
 *   characterId: number,
 *   loreId: number,
 * }} CharacterLore
 */

/** @param {Record<string, unknown> | null} row */
function mapCharacterLoreRow(row) {
  if (!row) {
    return null
  }

  return {
    characterId: row.character_id ?? 0,
    loreId: row.lore_id ?? 0,
  }
}

/** @param {string | number} characterId */
function parseNumericCharacterId(characterId) {
  const numericCharacterId = Number(characterId)

  if (Number.isNaN(numericCharacterId)) {
    throw new Error('Invalid character id')
  }

  return numericCharacterId
}

/** @param {string | number} loreId */
function parseNumericLoreId(loreId) {
  const numericLoreId = Number(loreId)

  if (Number.isNaN(numericLoreId)) {
    throw new Error('Invalid lore id')
  }

  return numericLoreId
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @returns {Promise<CharacterLore[]>}
 */
export async function getCharacterLores(characterId) {
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
    .from('character_lores')
    .select(CHARACTER_LORE_COLUMNS)
    .eq('character_id', numericCharacterId)
    .order('lore_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapCharacterLoreRow).filter(Boolean)
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @param {string | number} loreId Numeric lore id (`lores.lore_id`)
 * @returns {Promise<CharacterLore>}
 */
export async function addCharacterLore(characterId, loreId) {
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
  const numericLoreId = parseNumericLoreId(loreId)

  const { data, error } = await supabase
    .from('character_lores')
    .insert({
      character_id: numericCharacterId,
      lore_id: numericLoreId,
    })
    .select(CHARACTER_LORE_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const characterLore = mapCharacterLoreRow(data)

  if (!characterLore) {
    throw new Error('Character lore not found')
  }

  return characterLore
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @param {string | number} loreId Numeric lore id (`lores.lore_id`)
 * @returns {Promise<void>}
 */
export async function removeCharacterLore(characterId, loreId) {
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
  const numericLoreId = parseNumericLoreId(loreId)

  const { error } = await supabase
    .from('character_lores')
    .delete()
    .eq('character_id', numericCharacterId)
    .eq('lore_id', numericLoreId)

  if (error) {
    throw new Error(error.message)
  }
}

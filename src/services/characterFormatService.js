import { supabase } from './supabaseClient'

const CHARACTER_FORMAT_COLUMNS = ['character_id', 'format_id'].join(', ')

/**
 * @typedef {{
 *   characterId: number,
 *   formatId: number,
 * }} CharacterFormat
 */

/** @param {Record<string, unknown> | null} row */
function mapCharacterFormatRow(row) {
  if (!row) {
    return null
  }

  return {
    characterId: row.character_id ?? 0,
    formatId: row.format_id ?? 0,
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

/** @param {string | number} formatId */
function parseNumericFormatId(formatId) {
  const numericFormatId = Number(formatId)

  if (Number.isNaN(numericFormatId)) {
    throw new Error('Invalid format id')
  }

  return numericFormatId
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @returns {Promise<CharacterFormat[]>}
 */
export async function getCharacterFormats(characterId) {
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
    .from('character_formats')
    .select(CHARACTER_FORMAT_COLUMNS)
    .eq('character_id', numericCharacterId)
    .order('format_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapCharacterFormatRow).filter(Boolean)
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @param {string | number} formatId Numeric format id (`formats.format_id`)
 * @returns {Promise<CharacterFormat>}
 */
export async function addCharacterFormat(characterId, formatId) {
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
  const numericFormatId = parseNumericFormatId(formatId)

  const { data, error } = await supabase
    .from('character_formats')
    .insert({
      character_id: numericCharacterId,
      format_id: numericFormatId,
    })
    .select(CHARACTER_FORMAT_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const characterFormat = mapCharacterFormatRow(data)

  if (!characterFormat) {
    throw new Error('Character format not found')
  }

  return characterFormat
}

/**
 * @param {string | number} characterId Numeric character business id (`characters.character_id`)
 * @param {string | number} formatId Numeric format id (`formats.format_id`)
 * @returns {Promise<void>}
 */
export async function removeCharacterFormat(characterId, formatId) {
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
  const numericFormatId = parseNumericFormatId(formatId)

  const { error } = await supabase
    .from('character_formats')
    .delete()
    .eq('character_id', numericCharacterId)
    .eq('format_id', numericFormatId)

  if (error) {
    throw new Error(error.message)
  }
}

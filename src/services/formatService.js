import { supabase } from './supabaseClient'

const FORMAT_COLUMNS = ['format_id', 'name'].join(', ')

/**
 * @typedef {{
 *   formatID: number,
 *   formatName: string,
 * }} Format
 */

/** @param {Record<string, unknown> | null} row */
function mapFormatRow(row) {
  if (!row) {
    return null
  }

  return {
    formatID: row.format_id ?? 0,
    formatName: row.name ?? '',
  }
}

/** @returns {Promise<Format[]>} */
export async function getAllFormats() {
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
    .from('formats')
    .select(FORMAT_COLUMNS)
    .order('format_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapFormatRow).filter(Boolean)
}

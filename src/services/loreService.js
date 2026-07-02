import { supabase } from './supabaseClient'

const LORE_COLUMNS = ['lore_id', 'name'].join(', ')

/**
 * @typedef {{
 *   loreID: number,
 *   loreName: string,
 * }} Lore
 */

/** @param {Record<string, unknown> | null} row */
function mapLoreRow(row) {
  if (!row) {
    return null
  }

  return {
    loreID: row.lore_id ?? 0,
    loreName: row.name ?? '',
  }
}

/** @returns {Promise<Lore[]>} */
export async function getAllLores() {
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
    .from('lores')
    .select(LORE_COLUMNS)
    .order('lore_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapLoreRow).filter(Boolean)
}

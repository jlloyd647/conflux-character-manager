import { supabase } from './supabaseClient'

const BANE_COLUMNS = [
  'bane_id',
  'bloodline_id',
  'name',
  'description',
  'is_major',
].join(', ')

/**
 * @typedef {{
 *   baneID: number,
 *   bloodlineID: number,
 *   baneName: string,
 *   baneDescription: string,
 *   isMajor: boolean,
 * }} Bane
 */

/** @param {Record<string, unknown> | null} row */
function mapBaneRow(row) {
  if (!row) {
    return null
  }

  return {
    baneID: row.bane_id ?? 0,
    bloodlineID: row.bloodline_id ?? 0,
    baneName: row.name ?? '',
    baneDescription: row.description ?? '',
    isMajor: row.is_major ?? false,
  }
}

export async function getAllBanes() {
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
    .from('banes')
    .select(BANE_COLUMNS)
    .order('bane_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapBaneRow).filter(Boolean)
}

import { supabase } from './supabaseClient'

const BLOODLINE_COLUMNS = ['bloodline_id', 'name'].join(', ')

/**
 * @typedef {{
 *   bloodlineID: number,
 *   bloodlineName: string,
 * }} Bloodline
 */

/** @param {Record<string, unknown> | null} row */
function mapBloodlineRow(row) {
  if (!row) {
    return null
  }

  return {
    bloodlineID: row.bloodline_id ?? 0,
    bloodlineName: row.name ?? '',
  }
}

export async function getAllBloodlines() {
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
    .from('bloodlines')
    .select(BLOODLINE_COLUMNS)
    .order('bloodline_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapBloodlineRow).filter(Boolean)
}

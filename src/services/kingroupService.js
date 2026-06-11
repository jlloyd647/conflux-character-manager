import { supabase } from './supabaseClient'

const KINGROUP_COLUMNS = ['kingroup_id', 'bloodline_id', 'name'].join(', ')

/**
 * @typedef {{
 *   kingroupID: number,
 *   bloodlineID: number,
 *   kingroupName: string,
 * }} Kingroup
 */

/** @param {Record<string, unknown> | null} row */
function mapKingroupRow(row) {
  if (!row) {
    return null
  }

  return {
    kingroupID: row.kingroup_id ?? 0,
    bloodlineID: row.bloodline_id ?? 0,
    kingroupName: row.name ?? '',
  }
}

export async function getAllKingroups() {
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
    .from('kingroups')
    .select(KINGROUP_COLUMNS)
    .order('kingroup_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapKingroupRow).filter(Boolean)
}

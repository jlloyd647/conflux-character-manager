import { supabase } from './supabaseClient'

const ROW_STATUS_COLUMNS = ['id', 'status_name'].join(', ')

/**
 * @typedef {{
 *   rowStatusID: number,
 *   statusName: string,
 * }} RowStatus
 */

/** @param {Record<string, unknown> | null} row */
function mapRowStatusRow(row) {
  if (!row) {
    return null
  }

  return {
    rowStatusID: row.id ?? 0,
    statusName: row.status_name ?? '',
  }
}

/** @returns {Promise<RowStatus[]>} */
export async function getAllRowStatuses() {
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
    .from('row_status')
    .select(ROW_STATUS_COLUMNS)
    .order('id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapRowStatusRow).filter(Boolean)
}

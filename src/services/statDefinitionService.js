import { supabase } from './supabaseClient'

const STAT_COLUMNS = ['stat_id', 'name', 'max_value'].join(', ')

/**
 * @typedef {{
 *   statID: number,
 *   statName: string,
 *   statMaxValue: number | null,
 * }} Stat
 */

/** @param {unknown} value */
function mapNumericField(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)

  return Number.isNaN(parsed) ? null : parsed
}

/** @param {Record<string, unknown> | null} row */
function mapStatRow(row) {
  if (!row) {
    return null
  }

  return {
    statID: row.stat_id ?? 0,
    statName: row.name ?? '',
    statMaxValue: mapNumericField(row.max_value),
  }
}

export async function getAllStats() {
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
    .from('stats')
    .select(STAT_COLUMNS)
    .order('stat_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapStatRow).filter(Boolean)
}

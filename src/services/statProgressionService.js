import { supabase } from './supabaseClient'

const STAT_PROGRESSION_COLUMNS = [
  'progression_id',
  'stat_id',
  'min_value',
  'max_value',
  'xp_cost',
  'increase_amount',
].join(', ')

/**
 * @typedef {{
 *   progressionID: number,
 *   statID: number,
 *   progressionMinVal: number | null,
 *   progressionMaxVal: number | null,
 *   progressionXPCost: number | null,
 *   progressionIncAmt: number | null,
 * }} StatProgression
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
function mapStatProgressionRow(row) {
  if (!row) {
    return null
  }

  return {
    progressionID: row.progression_id ?? 0,
    statID: row.stat_id ?? 0,
    progressionMinVal: mapNumericField(row.min_value),
    progressionMaxVal: mapNumericField(row.max_value),
    progressionXPCost: mapNumericField(row.xp_cost),
    progressionIncAmt: mapNumericField(row.increase_amount),
  }
}

export async function getAllStatProgressions() {
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
    .from('stat_progression')
    .select(STAT_PROGRESSION_COLUMNS)
    .order('progression_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapStatProgressionRow).filter(Boolean)
}

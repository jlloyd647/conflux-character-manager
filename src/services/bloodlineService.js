import { supabase } from './supabaseClient'

const BLOODLINE_COLUMNS = [
  'bloodline_id',
  'name',
  'min_strength',
  'max_strength',
  'min_vitality',
  'max_vitality',
  'min_mind',
  'max_mind',
  'min_willpower',
  'max_willpower',
].join(', ')

/**
 * @typedef {{
 *   bloodlineID: number,
 *   bloodlineName: string,
 *   minStrength: number | null,
 *   maxStrength: number | null,
 *   minVitality: number | null,
 *   maxVitality: number | null,
 *   minMind: number | null,
 *   maxMind: number | null,
 *   minWillpower: number | null,
 *   maxWillpower: number | null,
 * }} Bloodline
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
function mapBloodlineRow(row) {
  if (!row) {
    return null
  }

  return {
    bloodlineID: row.bloodline_id ?? 0,
    bloodlineName: row.name ?? '',
    minStrength: mapNumericField(row.min_strength),
    maxStrength: mapNumericField(row.max_strength),
    minVitality: mapNumericField(row.min_vitality),
    maxVitality: mapNumericField(row.max_vitality),
    minMind: mapNumericField(row.min_mind),
    maxMind: mapNumericField(row.max_mind),
    minWillpower: mapNumericField(row.min_willpower),
    maxWillpower: mapNumericField(row.max_willpower),
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

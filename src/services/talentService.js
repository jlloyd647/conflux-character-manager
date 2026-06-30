import { supabase } from './supabaseClient'

const TALENT_COLUMNS = [
  'talent_id',
  'name',
  'description',
  'level',
  'xp_cost',
  'bloodline_id',
  'prereq_id',
].join(', ')

/**
 * @typedef {{
 *   talentID: number,
 *   talentName: string,
 *   talentDescription: string,
 *   talentLevel: number | null,
 *   talentXPCost: number | null,
 *   talentBloodlineID: number,
 *   prereqID: number | null,
 * }} Talent
 */

/** @param {unknown} value */
function mapNumericField(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

/** @param {Record<string, unknown> | null} row */
function mapTalentRow(row) {
  if (!row) {
    return null
  }

  return {
    talentID: row.talent_id ?? 0,
    talentName: row.name ?? '',
    talentDescription: row.description ?? '',
    talentLevel: mapNumericField(row.level),
    talentXPCost: mapNumericField(row.xp_cost),
    talentBloodlineID: row.bloodline_id ?? 0,
    prereqID: row.prereq_id ?? null,
  }
}

export async function getAllTalents() {
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
    .from('talents')
    .select(TALENT_COLUMNS)
    .order('talent_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapTalentRow).filter(Boolean)
}

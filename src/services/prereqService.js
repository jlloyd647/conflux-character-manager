import { supabase } from './supabaseClient'

const PREREQ_COLUMNS = ['prereq_id', 'required_ranks', 'ranks', 'message'].join(', ')

/**
 * @typedef {{
 *   prereqID: number,
 *   prereqRequiredRanks: number | null,
 *   prereqRanks: string,
 *   prereqMessage: string,
 * }} Prereq
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
function mapPrereqRow(row) {
  if (!row) {
    return null
  }

  return {
    prereqID: row.prereq_id ?? 0,
    prereqRequiredRanks: mapNumericField(row.required_ranks),
    prereqRanks: row.ranks ?? '',
    prereqMessage: row.message ?? '',
  }
}

export async function getAllPrereqs() {
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

  const { data, error, count } = await supabase
    .from('prereqs')
    .select(PREREQ_COLUMNS, { count: 'exact' })
    .order('prereq_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  if ((data ?? []).length === 0 && count === 0) {
    console.warn(
      '[prereqService] getAllPrereqs returned no rows. If rows exist in Supabase, check RLS policies (see supabase/sql/prereqs-rls.sql).',
    )
  }

  return (data ?? []).map(mapPrereqRow).filter(Boolean)
}

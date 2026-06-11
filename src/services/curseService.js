import { supabase } from './supabaseClient'

const CURSE_COLUMNS = ['curse_id', 'bloodline_id', 'name', 'description'].join(', ')

/**
 * @typedef {{
 *   curseID: number,
 *   bloodlineID: number,
 *   curseName: string,
 *   curseDescription: string,
 * }} Curse
 */

/** @param {Record<string, unknown> | null} row */
function mapCurseRow(row) {
  if (!row) {
    return null
  }

  return {
    curseID: row.curse_id ?? 0,
    bloodlineID: row.bloodline_id ?? 0,
    curseName: row.name ?? '',
    curseDescription: row.description ?? '',
  }
}

export async function getAllCurses() {
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

  console.log('[curseService] getAllCurses request:', {
    table: 'curses',
    select: CURSE_COLUMNS,
    order: { column: 'curse_id', ascending: true },
    userId: user.id,
  })

  const { data, error } = await supabase
    .from('curses')
    .select(CURSE_COLUMNS)
    .order('curse_id', { ascending: true })

  console.log('[curseService] getAllCurses response:', {
    data,
    error,
    count: data?.length ?? 0,
  })

  if (error) {
    console.error('[curseService] getAllCurses failed:', { error })
    throw new Error(error.message)
  }

  const curses = (data ?? []).map(mapCurseRow).filter(Boolean)

  console.log('[curseService] getAllCurses mapped:', {
    count: curses.length,
    curses,
  })

  return curses
}

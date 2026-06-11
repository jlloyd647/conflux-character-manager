import { supabase } from './supabaseClient'

const GIFT_COLUMNS = ['gift_id', 'bloodline_id', 'name', 'description'].join(', ')

/**
 * @typedef {{
 *   giftID: number,
 *   bloodlineID: number,
 *   giftName: string,
 *   giftDescription: string,
 * }} Gift
 */

/** @param {Record<string, unknown> | null} row */
function mapGiftRow(row) {
  if (!row) {
    return null
  }

  return {
    giftID: row.gift_id ?? 0,
    bloodlineID: row.bloodline_id ?? 0,
    giftName: row.name ?? '',
    giftDescription: row.description ?? '',
  }
}

export async function getAllGifts() {
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
    .from('gifts')
    .select(GIFT_COLUMNS)
    .order('gift_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapGiftRow).filter(Boolean)
}

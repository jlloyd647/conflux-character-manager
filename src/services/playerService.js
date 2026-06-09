import { supabase } from './supabaseClient'

const PLAYER_COLUMNS = [
  'id',
  'user_id',
  'first_name',
  'last_name',
  'preferred_name',
  'pronouns',
  'email',
  'status',
  'discord_username',
  'created_at',
  'updated_at',
].join(', ')

/**
 * @typedef {'active' | 'inactive' | 'suspended'} PlayerStatus
 * @typedef {{
 *   id: string,
 *   userId: string,
 *   firstName: string,
 *   lastName: string,
 *   preferredName: string,
 *   pronouns: string,
 *   email: string,
 *   status: PlayerStatus,
 *   discordUsername: string,
 *   createdAt: string,
 *   updatedAt: string,
 * }} Player
 */

/** @param {Record<string, unknown> | null} row */
function mapPlayerRow(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    preferredName: row.preferred_name ?? '',
    pronouns: row.pronouns ?? '',
    email: row.email ?? '',
    status: row.status,
    discordUsername: row.discord_username ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listPlayers() {
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
    .from('players')
    .select('id, email, first_name, last_name, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

/**
 * @param {string} userId
 * @returns {Promise<Player | null>}
 */
export async function getPlayerByUserId(userId) {
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
    .from('players')
    .select(PLAYER_COLUMNS)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return mapPlayerRow(data)
}

/** @returns {Promise<Player | null>} */
export async function getCurrentPlayer() {
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

  return getPlayerByUserId(user.id)
}

import { ROW_STATUS } from '../constants/rowStatus'
import { supabase } from './supabaseClient'
import { getProfileById } from './profileService'

const PLAYER_COLUMNS = [
  'id',
  'player_id',
  'user_id',
  'first_name',
  'last_name',
  'preferred_name',
  'pronouns',
  'email',
  'status',
  'discord_username',
  'preferred_contact_method',
  'hear_about_conflux',
  'interested_in_conflux',
  'created_at',
  'updated_at',
].join(', ')

const PLAYER_FIELD_TO_COLUMN = {
  firstName: 'first_name',
  lastName: 'last_name',
  preferredName: 'preferred_name',
  pronouns: 'pronouns',
  email: 'email',
  discordUsername: 'discord_username',
  preferredContactMethod: 'preferred_contact_method',
  hearAboutConflux: 'hear_about_conflux',
  interestedInConflux: 'interested_in_conflux',
}

const UPDATABLE_PLAYER_COLUMNS = new Set(Object.values(PLAYER_FIELD_TO_COLUMN))

export const PLAYER_STATUS = ROW_STATUS

/**
 * @typedef {1 | 2 | 3 | 4 | 5 | 6} PlayerStatus
 * @typedef {{
 *   id: string,
 *   playerId: string,
 *   userId: string,
 *   firstName: string,
 *   lastName: string,
 *   preferredName: string,
 *   pronouns: string,
 *   email: string,
 *   status: PlayerStatus,
 *   discordUsername: string,
 *   preferredContactMethod: number | null,
 *   hearAboutConflux: string,
 *   interestedInConflux: string,
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
    playerId: row.player_id != null ? String(row.player_id) : '',
    userId: row.user_id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    preferredName: row.preferred_name ?? '',
    pronouns: row.pronouns ?? '',
    email: row.email ?? '',
    status: row.status != null ? Number(row.status) : null,
    discordUsername: row.discord_username ?? '',
    preferredContactMethod:
      row.preferred_contact_method != null
        ? Number(row.preferred_contact_method)
        : null,
    hearAboutConflux: row.hear_about_conflux ?? '',
    interestedInConflux: row.interested_in_conflux ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * @param {string | null | undefined} userType
 * @returns {Promise<string>}
 */
export async function getPostAuthPath(userType) {
  let role = userType

  if (!role || role === 'guest') {
    const profile = await getProfileById()
    role = profile?.role ?? 'player'
  }

  if (role === 'admin') {
    return '/admin'
  }

  if (role === 'staff') {
    return '/dashboard'
  }

  const player = await getCurrentPlayer()
  return player ? '/dashboard' : '/new-player'
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

/**
 * @param {string[]} ids Player row UUIDs (`players.id`)
 * @returns {Promise<Player[]>}
 */
export async function getPlayersByIds(ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))]

  if (!uniqueIds.length) {
    return []
  }

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
    .in('id', uniqueIds)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapPlayerRow).filter(Boolean)
}

/**
 * @returns {Promise<Player[]>}
 */
export async function getUnapprovedPlayers() {
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
    .eq('status', PLAYER_STATUS.PENDING_APPROVAL)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapPlayerRow).filter(Boolean)
}

/**
 * @param {string} playerId Player row UUID (`players.id`)
 * @returns {Promise<Player>}
 */
export async function approvePlayer(playerId) {
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
    .update({ status: PLAYER_STATUS.ACTIVE })
    .eq('id', playerId)
    .select(PLAYER_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const player = mapPlayerRow(data)

  if (!player) {
    throw new Error('Player not found')
  }

  return player
}

/**
 * @param {(string | number)[]} playerIds Numeric player business ids (`players.player_id`)
 * @returns {Promise<Player[]>}
 */
export async function getPlayersByPlayerIds(playerIds) {
  const uniqueIds = [
    ...new Set(
      playerIds.filter((id) => id !== null && id !== undefined && id !== ''),
    ),
  ]

  if (!uniqueIds.length) {
    return []
  }

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
    .in('player_id', uniqueIds)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map(mapPlayerRow).filter(Boolean)
}

/**
 * @param {string | number} playerId Numeric player business id (`players.player_id`)
 * @returns {Promise<Player | null>}
 */
export async function getPlayerByPlayerId(playerId) {
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
    .eq('player_id', playerId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return mapPlayerRow(data)
}

/**
 * @param {string} id Player row UUID (`players.id`)
 * @returns {Promise<Player | null>}
 */
export async function getPlayerByID(id) {
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
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return mapPlayerRow(data)
}

/**
 * @param {{
 *   userId?: string,
 *   firstName: string,
 *   lastName?: string,
 *   preferredName?: string,
 *   pronouns?: string,
 *   email: string,
 *   discordUsername?: string,
 *   preferredContactMethod?: number | null,
 *   hearAboutConflux?: string,
 *   interestedInConflux?: string,
 *   status?: PlayerStatus,
 * }} input
 * @returns {Promise<Player>}
 */
export async function createNewPlayer({
  userId,
  firstName,
  lastName = '',
  preferredName = '',
  pronouns = '',
  email,
  discordUsername = '',
  preferredContactMethod = null,
  hearAboutConflux = '',
  interestedInConflux = '',
  status = ROW_STATUS.ACTIVE,
}) {
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

  const insertPayload = {
    first_name: firstName,
    last_name: lastName,
    preferred_name: preferredName,
    pronouns,
    email,
    discord_username: discordUsername,
    status,
  }

  if (userId) {
    insertPayload.user_id = userId
  }

  if (preferredContactMethod != null) {
    insertPayload.preferred_contact_method = preferredContactMethod
  }

  if (hearAboutConflux) {
    insertPayload.hear_about_conflux = hearAboutConflux
  }

  if (interestedInConflux) {
    insertPayload.interested_in_conflux = interestedInConflux
  }

  const { data, error } = await supabase
    .from('players')
    .insert(insertPayload)
    .select(PLAYER_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const player = mapPlayerRow(data)

  if (!player) {
    throw new Error('Player not found')
  }

  return player
}

/**
 * @param {string} playerId
 * @param {string} column App field name (e.g. firstName) or database column (e.g. first_name)
 * @param {string} value
 * @returns {Promise<Player>}
 */
export async function updatePlayerColumnById(playerId, column, value) {
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

  const dbColumn = PLAYER_FIELD_TO_COLUMN[column] ?? column

  if (!UPDATABLE_PLAYER_COLUMNS.has(dbColumn)) {
    throw new Error(`Column "${column}" is not updatable`)
  }

  const { data, error } = await supabase
    .from('players')
    .update({ [dbColumn]: value })
    .eq('id', playerId)
    .select(PLAYER_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const player = mapPlayerRow(data)

  if (!player) {
    throw new Error('Player not found')
  }

  return player
}

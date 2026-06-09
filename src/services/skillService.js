import { supabase } from './supabaseClient'

const SKILL_COLUMNS = [
  'id',
  'created_at',
  'skill_id',
  'name',
  'description',
  'cost_will',
  'cost_mind',
  'cost_xp',
].join(', ')

/**
 * @typedef {{
 *   id: string,
 *   createdAt: string,
 *   skillID: number,
 *   skillName: string,
 *   skillDescription: string,
 *   costWill: number | null,
 *   costMind: number | null,
 *   costXP: number | null,
 * }} Skill
 */

/** @param {Record<string, unknown> | null} row */
function mapSkillRow(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    createdAt: row.created_at,
    skillID: row.skill_id ?? 0,
    skillName: row.name ?? '',
    skillDescription: row.description ?? '',
    costWill: row.cost_will ?? null,
    costMind: row.cost_mind ?? null,
    costXP: row.cost_xp ?? null,
  }
}

export async function getAllSkills() {
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
    .from('skills')
    .select(SKILL_COLUMNS)
    .order('skill_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

/**
 * @param {string} id Skill row UUID (`skills.id`)
 * @returns {Promise<Skill | null>}
 */
export async function getSkillByID(id) {
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

  console.log('[skillService] getSkillByID request:', {
    id,
    filterColumn: 'id',
  })

  const { data, error } = await supabase
    .from('skills')
    .select(SKILL_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[skillService] getSkillByID failed:', { id, error })
    throw new Error(error.message)
  }

  console.log('[skillService] getSkillByID response:', data)

  return mapSkillRow(data)
}

/**
 * @param {string} id Skill row UUID (`skills.id`)
 * @param {Partial<{
 *   skillName: string,
 *   skillDescription: string,
 *   costWill: number | null,
 *   costMind: number | null,
 *   costXP: number | null,
 * }>} updates
 * @returns {Promise<Skill>}
 */
export async function updateSkillByID(id, updates) {
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

  const payload = {}

  if (updates.skillName !== undefined) {
    payload.name = updates.skillName
  }

  if (updates.skillDescription !== undefined) {
    payload.description = updates.skillDescription
  }

  if (updates.costWill !== undefined) {
    payload.cost_will = updates.costWill
  }

  if (updates.costMind !== undefined) {
    payload.cost_mind = updates.costMind
  }

  if (updates.costXP !== undefined) {
    payload.cost_xp = updates.costXP
  }

  if (!Object.keys(payload).length) {
    throw new Error('No valid fields provided to update.')
  }

  console.log('[skillService] updateSkillByID request:', {
    id,
    filterColumn: 'id',
    updates,
    payload,
    select: SKILL_COLUMNS,
  })

  const { data, error } = await supabase
    .from('skills')
    .update(payload)
    .eq('id', id)
    .select(SKILL_COLUMNS)
    .single()

  if (error) {
    console.error('[skillService] updateSkillByID failed:', {
      id,
      updates,
      payload,
      error,
    })
    throw new Error(error.message)
  }

  console.log('[skillService] updateSkillByID response:', data)

  const skill = mapSkillRow(data)

  if (!skill) {
    throw new Error('Skill not found')
  }

  return skill
}

/**
 * @param {{
 *   skillID: number,
 *   skillName: string,
 *   skillDescription: string,
 *   costWill?: number | null,
 *   costMind?: number | null,
 *   costXP?: number | null,
 * }} input
 * @returns {Promise<Skill>}
 */
export async function createNewSkill({
  skillID,
  skillName,
  skillDescription,
  costWill = null,
  costMind = null,
  costXP = null,
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
    skill_id: skillID,
    name: skillName,
    description: skillDescription,
    cost_will: costWill,
    cost_mind: costMind,
    cost_xp: costXP,
  }

  console.log('[skillService] createNewSkill request:', {
    input: {
      skillID,
      skillName,
      skillDescription,
      costWill,
      costMind,
      costXP,
    },
    insertPayload,
    select: SKILL_COLUMNS,
  })

  const { data, error } = await supabase
    .from('skills')
    .insert(insertPayload)
    .select(SKILL_COLUMNS)
    .single()

  if (error) {
    console.error('[skillService] createNewSkill failed:', {
      insertPayload,
      error,
    })
    throw new Error(error.message)
  }

  console.log('[skillService] createNewSkill response:', data)

  const skill = mapSkillRow(data)

  if (!skill) {
    throw new Error('Skill not found')
  }

  return skill
}

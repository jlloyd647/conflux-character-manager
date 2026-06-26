import { supabase } from './supabaseClient'

const SKILL_COLUMNS = [
  'skill_id',
  'name',
  'description',
  'cost_will',
  'cost_mind',
  'cost_xp',
  'prereq_skill_id',
  'prereq_id',
].join(', ')

/**
 * @typedef {{
 *   skillID: number,
 *   skillName: string,
 *   skillDescription: string,
 *   costWill: number | null,
 *   costMind: number | null,
 *   costXP: number | null,
 *   prereqSkillID: number | null,
 *   prereqID: number | null,
 * }} Skill
 */

/** @param {Record<string, unknown> | null} row */
function mapSkillRow(row) {
  if (!row) {
    return null
  }

  return {
    skillID: row.skill_id ?? 0,
    skillName: row.name ?? '',
    skillDescription: row.description ?? '',
    costWill: row.cost_will ?? null,
    costMind: row.cost_mind ?? null,
    costXP: row.cost_xp ?? null,
    prereqSkillID: row.prereq_skill_id ?? null,
    prereqID: row.prereq_id ?? null,
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

  return (data ?? []).map(mapSkillRow).filter(Boolean)
}

/**
 * @param {string | number} skillID Numeric skill business id (`skills.skill_id`)
 * @returns {Promise<Skill | null>}
 */
export async function getSkillByID(skillID) {
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

  const numericSkillID = Number(skillID)

  if (Number.isNaN(numericSkillID)) {
    throw new Error('Invalid skill id')
  }

  const { data, error } = await supabase
    .from('skills')
    .select(SKILL_COLUMNS)
    .eq('skill_id', numericSkillID)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return mapSkillRow(data)
}

/**
 * @param {string | number} skillID Numeric skill business id (`skills.skill_id`)
 * @param {Partial<{
 *   skillName: string,
 *   skillDescription: string,
 *   costWill: number | null,
 *   costMind: number | null,
 *   costXP: number | null,
 *   prereqSkillID: number | null,
 *   prereqID: number | null,
 * }>} updates
 * @returns {Promise<Skill>}
 */
export async function updateSkillByID(skillID, updates) {
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

  const numericSkillID = Number(skillID)

  if (Number.isNaN(numericSkillID)) {
    throw new Error('Invalid skill id')
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

  if (updates.prereqSkillID !== undefined) {
    payload.prereq_skill_id = updates.prereqSkillID
  }

  if (updates.prereqID !== undefined) {
    payload.prereq_id = updates.prereqID
  }

  if (!Object.keys(payload).length) {
    throw new Error('No valid fields provided to update.')
  }

  const { data, error } = await supabase
    .from('skills')
    .update(payload)
    .eq('skill_id', numericSkillID)
    .select(SKILL_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

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
 *   prereqSkillID?: number | null,
 *   prereqID?: number | null,
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
  prereqSkillID = null,
  prereqID = null,
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
    prereq_skill_id: prereqSkillID,
    prereq_id: prereqID,
  }

  const { data, error } = await supabase
    .from('skills')
    .insert(insertPayload)
    .select(SKILL_COLUMNS)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const skill = mapSkillRow(data)

  if (!skill) {
    throw new Error('Skill not found')
  }

  return skill
}

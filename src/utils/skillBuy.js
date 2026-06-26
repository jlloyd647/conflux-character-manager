/**
 * @typedef {import('../services/skillService').Skill} Skill
 * @typedef {import('../services/talentService').Talent} Talent
 * @typedef {import('../services/prereqService').Prereq} Prereq
 * @typedef {import('../services/characterService').Character} Character
 * @typedef {import('../services/characterService').CharacterSkill} CharacterSkill
 * @typedef {import('../services/characterSkillPrereqService').CharacterSkillPrereq} CharacterSkillPrereq
 */

/**
 * @typedef {{
 *   valid: boolean,
 *   message: string,
 * }} SkillBuyCheckResult
 */

const PREREQ_RANK_FIELD_MAP = {
  talent_r1: 'skillPrereqTalentR1',
  talent_r2: 'skillPrereqTalentR2',
  talent_r3: 'skillPrereqTalentR3',
  social_r1: 'skillPrereqSocialR1',
  social_r2: 'skillPrereqSocialR2',
  social_r3: 'skillPrereqSocialR3',
}

/**
 * @param {Prereq | null | undefined} prereq
 * @param {string} fallbackMessage
 * @returns {string}
 */
export function resolvePrereqMessage(prereq, fallbackMessage) {
  const customMessage = prereq?.prereqMessage?.trim()

  return customMessage || fallbackMessage
}

/**
 * @param {Character} character
 * @param {number | null | undefined} [xpSpent]
 */
function getAvailableXp(character, xpSpent) {
  const totalXp = Number(character.xp ?? 0)
  const spent = Number(xpSpent ?? character.xpSpent ?? 0)

  return Math.max(0, totalXp - spent)
}

/**
 * @param {Character} character
 * @param {Skill} skill
 * @param {number | null | undefined} [xpSpent]
 * @returns {SkillBuyCheckResult}
 */
export function checkXPCost(character, skill, xpSpent) {
  if (skill.costXP === null || skill.costXP === undefined) {
    return { valid: true, message: '' }
  }

  const availableXp = getAvailableXp(character, xpSpent)
  const cost = Number(skill.costXP)

  if (availableXp >= cost) {
    return { valid: true, message: '' }
  }

  return {
    valid: false,
    message: `Not enough XP. Need ${cost}, have ${availableXp} available.`,
  }
}

/**
 * @param {CharacterSkill[]} characterSkills
 * @param {Skill} skill
 * @returns {SkillBuyCheckResult}
 */
export function checkSkillPrereq(characterSkills, skill) {
  if (skill.prereqSkillID === null || skill.prereqSkillID === undefined) {
    return { valid: true, message: '' }
  }

  const hasPrereqSkill = characterSkills.some(
    (characterSkill) => Number(characterSkill.skillId) === Number(skill.prereqSkillID),
  )

  if (hasPrereqSkill) {
    return { valid: true, message: '' }
  }

  return {
    valid: false,
    message: `Requires skill ID ${skill.prereqSkillID} before this skill can be purchased.`,
  }
}

/**
 * @param {number | null | undefined} prereqID
 * @param {CharacterSkillPrereq | null | undefined} characterSkillPrereq
 * @param {Prereq[]} prereqs
 * @returns {SkillBuyCheckResult}
 */
export function checkRankPrereqByID(prereqID, characterSkillPrereq, prereqs) {
  if (prereqID === null || prereqID === undefined) {
    return { valid: true, message: '' }
  }

  const prereq = prereqs.find((entry) => entry.prereqID === Number(prereqID))

  if (!prereq) {
    return {
      valid: false,
      message: `Prerequisite definition ${prereqID} was not found.`,
    }
  }

  const rankField = PREREQ_RANK_FIELD_MAP[prereq.prereqRanks]

  if (!rankField) {
    return {
      valid: false,
      message: resolvePrereqMessage(
        prereq,
        `Unknown prerequisite rank field "${prereq.prereqRanks}".`,
      ),
    }
  }

  const requiredRanks = Number(prereq.prereqRequiredRanks ?? 0)
  const currentRanks = Number(characterSkillPrereq?.[rankField] ?? 0)

  if (currentRanks >= requiredRanks) {
    return { valid: true, message: '' }
  }

  return {
    valid: false,
    message: resolvePrereqMessage(
      prereq,
      `Requires ${requiredRanks} ${prereq.prereqRanks} skill purchases, have ${currentRanks}.`,
    ),
  }
}

/**
 * @param {CharacterSkillPrereq | null | undefined} characterSkillPrereq
 * @param {Skill} skill
 * @param {Prereq[]} prereqs
 * @returns {SkillBuyCheckResult}
 */
export function checkSkillRank(characterSkillPrereq, skill, prereqs) {
  return checkRankPrereqByID(skill.prereqID, characterSkillPrereq, prereqs)
}

/**
 * @param {{
 *   character: Character,
 *   skill: Skill,
 *   characterSkills: CharacterSkill[],
 *   characterSkillPrereq?: CharacterSkillPrereq | null,
 *   prereqs: Prereq[],
 *   xpSpent?: number | null,
 * }} input
 * @returns {SkillBuyCheckResult}
 */
export function checkSkillPurchase({
  character,
  skill,
  characterSkills,
  characterSkillPrereq = null,
  prereqs,
  xpSpent,
}) {
  const checks = [
    checkXPCost(character, skill, xpSpent),
    checkSkillPrereq(characterSkills, skill),
    checkSkillRank(characterSkillPrereq, skill, prereqs),
  ]

  return checks.find((check) => !check.valid) ?? { valid: true, message: '' }
}

/**
 * @param {Character} character
 * @param {Talent} talent
 * @param {number | null | undefined} [xpSpent]
 * @returns {SkillBuyCheckResult}
 */
export function checkTalentXPCost(character, talent, xpSpent) {
  if (talent.talentXPCost === null || talent.talentXPCost === undefined) {
    return { valid: true, message: '' }
  }

  const availableXp = getAvailableXp(character, xpSpent)
  const cost = Number(talent.talentXPCost)

  if (availableXp >= cost) {
    return { valid: true, message: '' }
  }

  return {
    valid: false,
    message: `Not enough XP. Need ${cost}, have ${availableXp} available.`,
  }
}

/**
 * @param {{
 *   character: Character,
 *   talent: Talent,
 *   characterSkillPrereq?: CharacterSkillPrereq | null,
 *   prereqs?: Prereq[],
 *   xpSpent?: number | null,
 *   prereqID?: number | null,
 * }} input
 * @returns {SkillBuyCheckResult}
 */
export function checkTalentPurchase({
  character,
  talent,
  characterSkillPrereq = null,
  prereqs = [],
  xpSpent,
  prereqID = null,
}) {
  const resolvedPrereqID = prereqID ?? talent.prereqID ?? null

  const checks = [
    checkTalentXPCost(character, talent, xpSpent),
    checkRankPrereqByID(resolvedPrereqID, characterSkillPrereq, prereqs),
  ]

  return checks.find((check) => !check.valid) ?? { valid: true, message: '' }
}

/**
 * @typedef {import('../services/skillService').Skill} Skill
 * @typedef {import('../services/talentService').Talent} Talent
 * @typedef {import('../services/prereqService').Prereq} Prereq
 * @typedef {import('../services/characterService').Character} Character
 * @typedef {import('../services/characterService').CharacterSkill} CharacterSkill
 * @typedef {import('../services/characterService').CharacterTalent} CharacterTalent
 * @typedef {import('../services/characterSkillPrereqService').CharacterSkillPrereq} CharacterSkillPrereq
 */

/**
 * @typedef {{
 *   valid: boolean,
 *   message: string,
 * }} SkillBuyCheckResult
 */

const SOCIAL_SKILL_TYPE_ID = 7

/**
 * Skills a bloodline is not allowed to purchase: { [bloodlineID]: skillID[] }.
 * Bloodlines without an entry have no restrictions.
 * @type {Record<number, number[]>}
 */
const BLOODLINE_RESTRICTED_SKILLS = {
  7: [1063,1064,1065,1066,1067,1068,1069,1070,1071,1072,1073,1074,1075,1076], // Wright Combat debarment
}

/**
 * Skills that debar other skills: { [skillID]: skillID[] }.
 * Owning the key skill (purchased or free) blocks purchasing the listed skills.
 * The block works both ways: owning a listed skill also blocks purchasing the key skill.
 * @type {Record<number, number[]>}
 */
const SKILL_DEBARRED_SKILLS = {
  1152: [1140],
  1153: [1143],
  1154: [1141],
  1155: [1144],
  1156: [1142],
  1157: [1145],
  1158: [1143],
  1159: [1146],
  1160: [1144],
  1161: [1147],
  1162: [1145],
  1163: [1148],
}

/**
 * @typedef {{
 *   name: string,
 *   skillIDs: number[],
 *   maxOwned: number,
 *   bloodlineMaxOwned?: Record<number, number>,
 * }} ExclusiveSkillSet
 */

/**
 * Sets of skills where a character may only own a limited number of purchased skills.
 * A character may own any maxOwned skills from the set.
 * bloodlineMaxOwned replaces maxOwned for specific bloodlines: { [bloodlineID]: limit }.
 * Free skills (characterSkill.isFree) do not count toward the limit.
 * @type {ExclusiveSkillSet[]}
 */
const EXCLUSIVE_SKILL_SETS = [
  {
    name: 'Level 1 Format Specializations',
    skillIDs: [1140, 1143, 1146, 1149],
    maxOwned: 1,
    bloodlineMaxOwned: {},
  },
  {
    name: 'Level 2 Format Specializations',
    skillIDs: [1141, 1144, 1147, 1150],
    maxOwned: 1,
    bloodlineMaxOwned: {},
  },
  {
    name: 'Level 3 Format Specializations',
    skillIDs: [1142, 1145, 1148, 1151],
    maxOwned: 1,
    bloodlineMaxOwned: {},
  },
  {
    name: 'Type Specializations',
    skillIDs: [1017, 1018, 1019, 1020, 1021],
    maxOwned: 3,
    bloodlineMaxOwned: { 7: 4 },
  },
]

const MIN_BLOODLINE_ADJUSTED_XP_COST = 1

/**
 * @typedef {{
 *   skillID?: number,
 *   skillTypeID?: number,
 *   multiplier?: number,
 *   delta?: number,
 * }} BloodlineSkillXPModifier
 */

/**
 * XP cost adjustments per bloodline: { [bloodlineID]: BloodlineSkillXPModifier[] }.
 * Each rule matches by skillID or skillTypeID; a skillID rule takes precedence over a skillTypeID rule.
 * multiplier is applied first (rounded up), then delta is added.
 * The result never goes below MIN_BLOODLINE_ADJUSTED_XP_COST; skills with a base cost of 0 stay free.
 * @type {Record<number, BloodlineSkillXPModifier[]>}
 */
const BLOODLINE_SKILL_XP_MODIFIERS = {
  // 0: [
  //   { skillTypeID: 7, multiplier: 0.5 }, // Placeholder - Bloodline name: Social skills at half cost
  //   { skillID: 0, delta: -1 }, // Placeholder - Bloodline name: Skill name costs 1 less
  // ],
  1: [ // Undead
    { skillTypeID: 1, delta: -2 },
    { skillTypeID: 2, delta: -2 },
    { skillTypeID: 5, delta: -2 }
  ],

  2: [ // Shifter
    { skillTypeID: 3, delta: 1 },
    { skillTypeID: 7, multiplier: 0.5}
  ],

  4: [ // HalfBorn
    { skillID: 1001, delta: -1},
    { skillID: 1002, delta: -1},
    { skillID: 1003, delta: -1},
    { skillID: 1017, delta: -1},
    { skillID: 1018, delta: -1},
    { skillID: 1019, delta: -1},
    { skillID: 1020, delta: -1},
    { skillID: 1021, delta: -1}
  ],

  7: [ // Wrights
    { skillTypeID: 3, delta: -2}
  ]
}

/**
 * Skills a talent grants for free: { [talentID]: skillID }.
 * Must match public.talent_granted_skill_id() in supabase/sql/add-talent-skill.sql, which is what
 * actually grants and removes the free skill; this copy drives the app's checks.
 * @type {Record<number, number>}
 */
export const TALENT_GRANTED_SKILLS = {
  // 0: 0, // Placeholder - Talent name: grants Skill name
  64: 1140, // Elementalist Level 1 Alchemy
  65: 1143, // Elementalist Level 1 Enchantment
  73: 1141, // Elementalist Level 2 Alchemy
  74: 1144, // Elementalist Level 2 Enchantment
  78: 1142, // Elementalist Level 3 Alchemy
  79: 1145, // Elementalist Level 3 Enchantment
  85: 1143, // Fae Level 1 Enchantment
  86: 1147, // Fae Level 1 Ritualism
  93: 1144, // Fae Level 1 Enchantment
  94: 1148, // Fae Level 2 Ritualism
  98: 1145, // Fae Level 1 Enchantment
  99: 1149  // Fae Level 3 Ritualism
}

/**
 * @param {number | string | null | undefined} talentID
 * @returns {number | null}
 */
export function getTalentGrantedSkillID(talentID) {
  const skillID = TALENT_GRANTED_SKILLS[Number(talentID)]

  return skillID === undefined ? null : Number(skillID)
}

/**
 * @param {CharacterTalent[]} characterTalents
 * @param {number} skillID
 * @param {Talent[]} allTalents
 * @returns {Talent | null}
 */
function findOwnedTalentGrantingSkill(characterTalents, skillID, allTalents) {
  const characterTalent = characterTalents.find(
    (entry) => getTalentGrantedSkillID(entry.talentId) === Number(skillID),
  )

  if (!characterTalent) {
    return null
  }

  return (
    allTalents.find((talent) => Number(talent.talentID) === Number(characterTalent.talentId)) ?? {
      talentID: Number(characterTalent.talentId),
      talentName: String(characterTalent.talentId),
    }
  )
}

/**
 * @param {Pick<Skill, 'costXP' | 'skillID' | 'skillTypeID'>} skill
 * @param {number | string | null | undefined} bloodlineID
 * @returns {number | null}
 */
export function getBloodlineSkillXPCost(skill, bloodlineID) {
  if (skill.costXP === null || skill.costXP === undefined) {
    return null
  }

  const rules = BLOODLINE_SKILL_XP_MODIFIERS[Number(bloodlineID)] ?? []
  const rule =
    rules.find((entry) => entry.skillID !== undefined && entry.skillID === Number(skill.skillID)) ??
    rules.find(
      (entry) =>
        entry.skillTypeID !== undefined && entry.skillTypeID === Number(skill.skillTypeID),
    )

  const baseCost = Number(skill.costXP)

  if (!rule || baseCost <= 0) {
    return baseCost
  }

  const multiplied = Math.ceil(baseCost * (rule.multiplier ?? 1))

  return Math.max(MIN_BLOODLINE_ADJUSTED_XP_COST, multiplied + (rule.delta ?? 0))
}

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
  const cost = getBloodlineSkillXPCost(skill, character.bloodlineId)

  if (cost === null) {
    return { valid: true, message: '' }
  }

  const availableXp = getAvailableXp(character, xpSpent)

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
 * @param {number | string} skillID
 * @param {number | string | null | undefined} bloodlineID
 * @returns {boolean}
 */
export function isSkillRestrictedForBloodline(skillID, bloodlineID) {
  const restrictedSkillIDs = BLOODLINE_RESTRICTED_SKILLS[Number(bloodlineID)] ?? []

  return restrictedSkillIDs.includes(Number(skillID))
}

/**
 * @param {Character} character
 * @param {Skill} skill
 * @returns {SkillBuyCheckResult}
 */
export function checkBloodlineRestriction(character, skill) {
  if (!isSkillRestrictedForBloodline(skill.skillID, character.bloodlineId)) {
    return { valid: true, message: '' }
  }

  return {
    valid: false,
    message: `${skill.skillName || `Skill ${skill.skillID}`} cannot be purchased by this bloodline.`,
  }
}

/**
 * @param {CharacterSkill[]} characterSkills
 * @param {number | string} skillID
 * @returns {number | null} The owned skillID that debars skillID, or null
 */
function findDebarringSkillID(characterSkills, skillID) {
  const numericSkillID = Number(skillID)
  const ownedSkillIDs = characterSkills.map((characterSkill) => Number(characterSkill.skillId))

  return (
    ownedSkillIDs.find(
      (ownedSkillID) =>
        (SKILL_DEBARRED_SKILLS[ownedSkillID] ?? []).includes(numericSkillID) ||
        (SKILL_DEBARRED_SKILLS[numericSkillID] ?? []).includes(ownedSkillID),
    ) ?? null
  )
}

/**
 * @param {CharacterSkill[]} characterSkills
 * @param {number | string} skillID
 * @returns {boolean}
 */
export function isSkillDebarredBySkill(characterSkills, skillID) {
  return findDebarringSkillID(characterSkills, skillID) !== null
}

/**
 * @param {CharacterSkill[]} characterSkills
 * @param {Skill} skill
 * @param {Skill[]} [allSkills]
 * @returns {SkillBuyCheckResult}
 */
export function checkSkillDebarment(characterSkills, skill, allSkills = []) {
  const debarringSkillID = findDebarringSkillID(characterSkills, skill.skillID)

  if (debarringSkillID === null) {
    return { valid: true, message: '' }
  }

  const debarringSkillName =
    allSkills.find((entry) => Number(entry.skillID) === debarringSkillID)?.skillName ||
    `Skill ${debarringSkillID}`

  return {
    valid: false,
    message: `${skill.skillName || `Skill ${skill.skillID}`} cannot be purchased with ${debarringSkillName}.`,
  }
}

/**
 * @param {ExclusiveSkillSet} set
 * @param {number | string | null | undefined} bloodlineID
 * @returns {number}
 */
function getExclusiveSkillSetLimit(set, bloodlineID) {
  return set.bloodlineMaxOwned?.[Number(bloodlineID)] ?? set.maxOwned
}

/**
 * @param {CharacterSkill[]} characterSkills
 * @param {Pick<Skill, 'skillID'>} skill
 * @param {number | string | null | undefined} bloodlineID
 * @returns {{ set: ExclusiveSkillSet, limit: number } | null}
 */
function findBlockingExclusiveSkillSet(characterSkills, skill, bloodlineID) {
  const skillID = Number(skill.skillID)
  const purchasedSkillIDs = new Set(
    characterSkills
      .filter((characterSkill) => !characterSkill.isFree)
      .map((characterSkill) => Number(characterSkill.skillId)),
  )

  for (const set of EXCLUSIVE_SKILL_SETS) {
    if (!set.skillIDs.includes(skillID)) {
      continue
    }

    const limit = getExclusiveSkillSetLimit(set, bloodlineID)
    const ownedCount = set.skillIDs.filter((id) => purchasedSkillIDs.has(id)).length

    if (ownedCount >= limit) {
      return { set, limit }
    }
  }

  return null
}

/**
 * @param {CharacterSkill[]} characterSkills
 * @param {Pick<Skill, 'skillID'>} skill
 * @param {number | string | null | undefined} bloodlineID
 * @returns {boolean}
 */
export function isSkillBlockedBySet(characterSkills, skill, bloodlineID) {
  return findBlockingExclusiveSkillSet(characterSkills, skill, bloodlineID) !== null
}

/**
 * @param {CharacterSkill[]} characterSkills
 * @param {Pick<Skill, 'skillID'>} skill
 * @param {number | string | null | undefined} bloodlineID
 * @returns {SkillBuyCheckResult}
 */
export function checkExclusiveSkillSet(characterSkills, skill, bloodlineID) {
  const blocking = findBlockingExclusiveSkillSet(characterSkills, skill, bloodlineID)

  if (!blocking) {
    return { valid: true, message: '' }
  }

  const setName = blocking.set.name || 'this skill set'

  return {
    valid: false,
    message: `You can only own ${blocking.limit} skill(s) from ${setName}.`,
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
 * @param {CharacterSkillPrereq | null | undefined} characterSkillPrereq
 * @param {Talent} talent
 * @param {Prereq[]} prereqs
 * @returns {SkillBuyCheckResult}
 */
export function checkTalentRank(characterSkillPrereq, talent, prereqs) {
  return checkRankPrereqByID(talent.prereqID, characterSkillPrereq, prereqs)
}

/**
 * @param {{
 *   character: Character,
 *   skill: Skill,
 *   characterSkills: CharacterSkill[],
 *   characterSkillPrereq?: CharacterSkillPrereq | null,
 *   prereqs: Prereq[],
 *   xpSpent?: number | null,
 *   allSkills?: Skill[],
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
  allSkills = [],
}) {
  const checks = [
    checkBloodlineRestriction(character, skill),
    checkSkillDebarment(characterSkills, skill, allSkills),
    checkExclusiveSkillSet(characterSkills, skill, character.bloodlineId),
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
  const checks = [
    checkTalentXPCost(character, talent, xpSpent),
    checkRankPrereqByID(prereqID ?? talent.prereqID ?? null, characterSkillPrereq, prereqs),
  ]

  return checks.find((check) => !check.valid) ?? { valid: true, message: '' }
}

/**
 * @param {Skill} skill
 * @returns {string | null}
 */
function getSkillRemovalRankKey(skill) {
  if (Number(skill.skillTypeID) !== SOCIAL_SKILL_TYPE_ID) {
    return null
  }

  const rank = Number(skill.skillRank)

  if (!Number.isFinite(rank) || rank < 1 || rank > 3) {
    return null
  }

  return `social_r${rank}`
}

/**
 * @param {Talent} talent
 * @returns {string | null}
 */
function getTalentRemovalRankKey(talent) {
  const level = Number(talent.talentLevel)

  if (!Number.isFinite(level) || level < 1 || level > 3) {
    return null
  }

  return `talent_r${level}`
}

/**
 * @param {'skill' | 'talent'} itemLabel
 * @param {string[]} dependentNames
 * @returns {string}
 */
function formatPrereqRemovalMessage(itemLabel, dependentNames) {
  return `Cannot remove ${itemLabel}. It is a prereq for ${dependentNames.join(', ')}.`
}

/**
 * @param {string} rankKey
 * @param {CharacterSkillPrereq | null | undefined} characterSkillPrereq
 * @param {Prereq[]} prereqs
 * @param {CharacterSkill[]} characterSkills
 * @param {CharacterTalent[]} characterTalents
 * @param {Skill[]} allSkills
 * @param {Talent[]} allTalents
 * @param {'skill' | 'talent'} itemLabel
 * @returns {SkillBuyCheckResult}
 */
function checkRankRemovalViolations(
  rankKey,
  characterSkillPrereq,
  prereqs,
  characterSkills,
  characterTalents,
  allSkills,
  allTalents,
  itemLabel,
) {
  const rankField = PREREQ_RANK_FIELD_MAP[rankKey]

  if (!rankField) {
    return { valid: true, message: '' }
  }

  const countAfterRemoval = Math.max(0, Number(characterSkillPrereq?.[rankField] ?? 0) - 1)

  for (const characterSkill of characterSkills) {
    const skill = allSkills.find(
      (entry) => Number(entry.skillID) === Number(characterSkill.skillId),
    )

    if (!skill?.prereqID) {
      continue
    }

    const prereq = prereqs.find((entry) => entry.prereqID === Number(skill.prereqID))

    if (!prereq || prereq.prereqRanks !== rankKey) {
      continue
    }

    const requiredRanks = Number(prereq.prereqRequiredRanks ?? 0)

    if (countAfterRemoval < requiredRanks) {
      const skillName = skill.skillName || String(skill.skillID)

      return {
        valid: false,
        message: formatPrereqRemovalMessage(itemLabel, [skillName]),
      }
    }
  }

  for (const characterTalent of characterTalents) {
    const talent = allTalents.find(
      (entry) => Number(entry.talentID) === Number(characterTalent.talentId),
    )

    if (!talent?.prereqID) {
      continue
    }

    const prereq = prereqs.find((entry) => entry.prereqID === Number(talent.prereqID))

    if (!prereq || prereq.prereqRanks !== rankKey) {
      continue
    }

    const requiredRanks = Number(prereq.prereqRequiredRanks ?? 0)

    if (countAfterRemoval < requiredRanks) {
      const skillName = talent.talentName || String(talent.talentID)

      return {
        valid: false,
        message: formatPrereqRemovalMessage(itemLabel, [skillName]),
      }
    }
  }

  return { valid: true, message: '' }
}

/**
 * @param {CharacterSkill[]} characterSkills
 * @param {number | string} skillIdToRemove
 * @param {CharacterTalent[]} characterTalents
 * @param {CharacterSkillPrereq | null | undefined} characterSkillPrereq
 * @param {Prereq[]} prereqs
 * @param {Skill[]} allSkills
 * @param {Talent[]} allTalents
 * @returns {SkillBuyCheckResult}
 */
export function checkSkillRemoval(
  characterSkills,
  skillIdToRemove,
  characterTalents,
  characterSkillPrereq,
  prereqs,
  allSkills,
  allTalents,
) {
  const numericId = Number(skillIdToRemove)
  const grantingTalent = findOwnedTalentGrantingSkill(characterTalents, numericId, allTalents)

  if (grantingTalent) {
    const skillName =
      allSkills.find((entry) => Number(entry.skillID) === numericId)?.skillName ||
      String(numericId)

    return {
      valid: false,
      message: `Cannot remove ${skillName}. It comes from the ${grantingTalent.talentName} talent; remove the talent instead.`,
    }
  }

  return checkSkillRemovalDependencies(
    characterSkills,
    numericId,
    characterTalents,
    characterSkillPrereq,
    prereqs,
    allSkills,
    allTalents,
    'skill',
  )
}

/**
 * Prereq checks for removing a skill, whether removed directly or along with the talent that granted it.
 *
 * @param {CharacterSkill[]} characterSkills
 * @param {number} numericId
 * @param {CharacterTalent[]} characterTalents
 * @param {CharacterSkillPrereq | null | undefined} characterSkillPrereq
 * @param {Prereq[]} prereqs
 * @param {Skill[]} allSkills
 * @param {Talent[]} allTalents
 * @param {string} itemLabel
 * @returns {SkillBuyCheckResult}
 */
function checkSkillRemovalDependencies(
  characterSkills,
  numericId,
  characterTalents,
  characterSkillPrereq,
  prereqs,
  allSkills,
  allTalents,
  itemLabel,
) {
  const dependents = []

  for (const characterSkill of characterSkills) {
    if (Number(characterSkill.skillId) === numericId) {
      continue
    }

    const skill = allSkills.find(
      (entry) => Number(entry.skillID) === Number(characterSkill.skillId),
    )

    if (skill && Number(skill.prereqSkillID) === numericId) {
      dependents.push(skill)
    }
  }

  if (dependents.length) {
    return {
      valid: false,
      message: formatPrereqRemovalMessage(
        itemLabel,
        dependents.map((skill) => skill.skillName || String(skill.skillID)),
      ),
    }
  }

  const skillToRemove = allSkills.find((entry) => Number(entry.skillID) === numericId)
  const rankKey = skillToRemove ? getSkillRemovalRankKey(skillToRemove) : null

  if (!rankKey) {
    return { valid: true, message: '' }
  }

  return checkRankRemovalViolations(
    rankKey,
    characterSkillPrereq,
    prereqs,
    characterSkills,
    characterTalents,
    allSkills,
    allTalents,
    itemLabel,
  )
}

/**
 * @param {CharacterSkill[]} characterSkills
 * @param {CharacterTalent[]} characterTalents
 * @param {CharacterSkillPrereq | null | undefined} characterSkillPrereq
 * @param {Talent} talent
 * @param {Prereq[]} prereqs
 * @param {Skill[]} allSkills
 * @param {Talent[]} allTalents
 * @returns {SkillBuyCheckResult}
 */
export function checkTalentRemoval(
  characterSkills,
  characterTalents,
  characterSkillPrereq,
  talent,
  prereqs,
  allSkills,
  allTalents,
) {
  const numericTalentId = Number(talent.talentID)
  const skillPrereqDependents = []

  for (const characterSkill of characterSkills) {
    const skill = allSkills.find(
      (entry) => Number(entry.skillID) === Number(characterSkill.skillId),
    )

    if (skill && Number(skill.prereqSkillID) === numericTalentId) {
      skillPrereqDependents.push(skill)
    }
  }

  if (skillPrereqDependents.length) {
    return {
      valid: false,
      message: formatPrereqRemovalMessage(
        'talent',
        skillPrereqDependents.map((skill) => skill.skillName || String(skill.skillID)),
      ),
    }
  }

  const grantedSkillID = getTalentGrantedSkillID(numericTalentId)
  const remainingTalents = characterTalents.filter(
    (entry) => Number(entry.talentId) !== numericTalentId,
  )
  const losesGrantedSkill =
    grantedSkillID !== null &&
    characterSkills.some(
      (entry) => Number(entry.skillId) === grantedSkillID && entry.isFree,
    ) &&
    !findOwnedTalentGrantingSkill(remainingTalents, grantedSkillID, allTalents)

  if (losesGrantedSkill) {
    const grantedSkillName =
      allSkills.find((entry) => Number(entry.skillID) === grantedSkillID)?.skillName ||
      String(grantedSkillID)
    const grantedSkillCheck = checkSkillRemovalDependencies(
      characterSkills,
      grantedSkillID,
      remainingTalents,
      characterSkillPrereq,
      prereqs,
      allSkills,
      allTalents,
      `talent (it grants ${grantedSkillName})`,
    )

    if (!grantedSkillCheck.valid) {
      return grantedSkillCheck
    }
  }

  const rankKey = getTalentRemovalRankKey(talent)

  if (!rankKey) {
    return { valid: true, message: '' }
  }

  return checkRankRemovalViolations(
    rankKey,
    characterSkillPrereq,
    prereqs,
    characterSkills,
    characterTalents,
    allSkills,
    allTalents,
    'talent',
  )
}

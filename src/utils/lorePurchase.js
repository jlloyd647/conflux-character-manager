export const EDUCATION_LORE_SKILL_IDS = [1087, 1088, 1089]

export const LORES_PER_EDUCATION_SKILL = 3

export const EDUCATION_LORE_REQUIRED_MESSAGE =
  'Education L1 and above is required for skills'

/** @param {{ skillId: number }[]} characterSkills */
export function countEducationLoreSkills(characterSkills) {
  const educationSkillIds = new Set(EDUCATION_LORE_SKILL_IDS)

  return characterSkills.filter((skill) => educationSkillIds.has(Number(skill.skillId)))
    .length
}

/** @param {{ skillId: number }[]} characterSkills */
export function getMaxCharacterLores(characterSkills) {
  return countEducationLoreSkills(characterSkills) * LORES_PER_EDUCATION_SKILL
}

/** @param {{ skillId: number }[]} characterSkills */
export function hasEducationLoreAccess(characterSkills) {
  return countEducationLoreSkills(characterSkills) > 0
}

/** @param {{ skillId: number }[]} characterSkills @param {{ loreId: number }[]} characterLores */
export function canPurchaseMoreLores(characterSkills, characterLores) {
  return characterLores.length < getMaxCharacterLores(characterSkills)
}

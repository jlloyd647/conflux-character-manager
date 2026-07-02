export const SPECIALIZATION_FORMAT_SKILL_IDS = [1014, 1015, 1016]

export const FORMATS_PER_SPECIALIZATION_SKILL = 1

export const SPECIALIZATION_FORMAT_REQUIRED_MESSAGE =
  'Specilization L1 and above is required for formats'

/** @param {{ skillId: number }[]} characterSkills */
export function countSpecializationFormatSkills(characterSkills) {
  const specializationSkillIds = new Set(SPECIALIZATION_FORMAT_SKILL_IDS)

  return characterSkills.filter((skill) =>
    specializationSkillIds.has(Number(skill.skillId)),
  ).length
}

/** @param {{ skillId: number }[]} characterSkills */
export function getMaxCharacterFormats(characterSkills) {
  return countSpecializationFormatSkills(characterSkills) * FORMATS_PER_SPECIALIZATION_SKILL
}

/** @param {{ skillId: number }[]} characterSkills */
export function hasSpecializationFormatAccess(characterSkills) {
  return countSpecializationFormatSkills(characterSkills) > 0
}

/** @param {{ skillId: number }[]} characterSkills @param {{ formatId: number }[]} characterFormats */
export function canPurchaseMoreFormats(characterSkills, characterFormats) {
  return characterFormats.length < getMaxCharacterFormats(characterSkills)
}

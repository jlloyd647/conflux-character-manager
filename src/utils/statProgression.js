import {
  calculateStatXpSpent,
  findProgressionBracketForDecrease,
  findProgressionBracketForIncrease,
  getProgressionForDecrease,
  getProgressionForIncrease,
} from './statCalculation'

/**
 * Fallback map when stats reference data is unavailable.
 * Prefer resolving IDs from loaded stats by name.
 */
export const CHARACTER_STAT_IDS = {
  vitality: 1,
  mind: 2,
  strength: 3,
  willpower: 4,
}

const CHARACTER_STAT_NAMES = {
  vitality: 'Vitality',
  mind: 'Mind',
  strength: 'Strength',
  willpower: 'Willpower',
}

const CHARACTER_STAT_KEYS = Object.keys(CHARACTER_STAT_NAMES)

const MAX_PROGRESSION_STEPS = 1000

export {
  findProgressionBracket,
  findProgressionBracketForDecrease,
  findProgressionBracketForIncrease,
} from './statCalculation'

/** @param {number | null | undefined} value */
function toNumericStatValue(value) {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * @typedef {import('../services/statProgressionService').StatProgression} StatProgression
 * @typedef {import('../services/statDefinitionService').Stat} Stat
 */

/**
 * @param {string} statKey
 * @param {Stat[]} stats
 */
export function getStatIdForCharacterStat(statKey, stats) {
  const statName = CHARACTER_STAT_NAMES[statKey]

  if (stats.length && statName) {
    const match = stats.find(
      (stat) => stat.statName.trim().toLowerCase() === statName.toLowerCase(),
    )

    if (match?.statID) {
      return Number(match.statID)
    }
  }

  return CHARACTER_STAT_IDS[statKey] ?? null
}

/**
 * @param {string} statKey
 * @param {StatProgression[]} statProgressions
 * @param {Stat[]} stats
 */
function getProgressionsForCharacterStat(statKey, statProgressions, stats) {
  const statId = getStatIdForCharacterStat(statKey, stats)

  if (!statId) {
    return []
  }

  return statProgressions.filter(
    (progression) => Number(progression.statID) === Number(statId),
  )
}

/**
 * @param {number | null | undefined} value
 * @param {StatProgression[]} progressions
 * @param {'increase' | 'decrease'} [direction]
 */
export function getStatProgressionIncrement(value, progressions, direction = 'increase') {
  const bracket =
    direction === 'decrease'
      ? findProgressionBracketForDecrease(value, progressions)
      : findProgressionBracketForIncrease(value, progressions)
  const increment = bracket?.progressionIncAmt

  if (increment === null || increment === undefined) {
    return 1
  }

  const parsed = Number(increment)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

/**
 * @param {string} statKey
 * @param {number | null | undefined} value
 * @param {StatProgression[]} statProgressions
 * @param {Stat[]} [stats]
 */
export function getCharacterStatIncreaseStep(statKey, value, statProgressions, stats = []) {
  const statId = getStatIdForCharacterStat(statKey, stats)

  if (!statId) {
    return getStatProgressionIncrement(
      value,
      getProgressionsForCharacterStat(statKey, statProgressions, stats),
      'increase',
    )
  }

  const progression = getProgressionForIncrease(
    statId,
    value,
    statProgressions,
    stats,
  )

  return progression?.increaseAmount ?? 1
}

/**
 * @param {string} statKey
 * @param {number | null | undefined} value
 * @param {StatProgression[]} statProgressions
 * @param {Stat[]} [stats]
 * @param {number | null | undefined} [baseValue]
 */
export function getCharacterStatDecreaseStep(
  statKey,
  value,
  statProgressions,
  stats = [],
  baseValue = 0,
) {
  const statId = getStatIdForCharacterStat(statKey, stats)

  if (!statId) {
    return getStatProgressionIncrement(
      value,
      getProgressionsForCharacterStat(statKey, statProgressions, stats),
      'decrease',
    )
  }

  const progression = getProgressionForDecrease(
    statId,
    value,
    statProgressions,
    stats,
    baseValue,
  )

  return progression?.increaseAmount ?? 1
}

/**
 * @param {number} from
 * @param {number} to
 * @param {StatProgression[]} progressions
 */
function calculateIncreaseXpCost(from, to, progressions) {
  if (from >= to) {
    return 0
  }

  let cost = 0
  let current = from
  let steps = 0

  while (current < to) {
    if (steps >= MAX_PROGRESSION_STEPS) {
      throw new Error('Stat progression XP calculation exceeded the maximum number of steps.')
    }

    const bracket = findProgressionBracketForIncrease(current, progressions)

    if (!bracket) {
      throw new Error(`No stat progression found for value ${current}.`)
    }

    const increaseAmount = bracket.progressionIncAmt ?? 1

    if (increaseAmount <= 0) {
      throw new Error('Stat progression increase amount must be greater than zero.')
    }

    cost += bracket.progressionXPCost ?? 0
    current += increaseAmount
    steps += 1
  }

  return cost
}

/**
 * @param {number | null | undefined} from
 * @param {number | null | undefined} to
 * @param {StatProgression[]} progressions
 */
export function calculateStatXpCostChange(from, to, progressions) {
  const start = toNumericStatValue(from)
  const end = toNumericStatValue(to)

  if (start === end) {
    return 0
  }

  if (start < end) {
    return calculateIncreaseXpCost(start, end, progressions)
  }

  return -calculateIncreaseXpCost(end, start, progressions)
}

/**
 * @param {Record<string, number | null | undefined>} baseStats
 * @param {Record<string, number | null | undefined>} nextStats
 * @param {StatProgression[]} statProgressions
 * @param {Stat[]} [stats]
 */
export function calculateCharacterStatsXpCostChange(
  baseStats,
  nextStats,
  statProgressions,
  stats = [],
) {
  let total = 0

  for (const statKey of CHARACTER_STAT_KEYS) {
    const progressions = getProgressionsForCharacterStat(statKey, statProgressions, stats)

    total += calculateStatXpCostChange(
      baseStats[statKey],
      nextStats[statKey],
      progressions,
    )
  }

  return total
}

/**
 * @param {string} statKey
 * @param {number | null | undefined} currentRank
 * @param {number | null | undefined} baseValue
 * @param {StatProgression[]} statProgressions
 * @param {Stat[]} [stats]
 */
export function calculateCharacterStatXpSpent(
  statKey,
  currentRank,
  baseValue,
  statProgressions,
  stats = [],
) {
  const statId = getStatIdForCharacterStat(statKey, stats)

  if (!statId) {
    return 0
  }

  return calculateStatXpSpent(statId, currentRank, baseValue, statProgressions)
}

/** @param {number} xpDelta */
export function formatStatXpCostDelta(xpDelta) {
  if (xpDelta === 0) {
    return '0'
  }

  return xpDelta > 0 ? `+${xpDelta}` : String(xpDelta)
}

/**
 * @typedef {import('../services/statProgressionService').StatProgression} StatProgression
 * @typedef {import('../services/statDefinitionService').Stat} Stat
 */

const MAX_PROGRESSION_STEPS = 1000

/** @param {number | null | undefined} value */
function toNumericValue(value) {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

/** @param {number | string} statId @param {Stat[]} stats */
function findStat(statId, stats) {
  if (!stats.length) {
    return null
  }

  return stats.find((stat) => Number(stat.statID) === Number(statId)) ?? null
}

/** @param {number | string} statId @param {StatProgression[]} progressionRules */
function getProgressionsForStatId(statId, progressionRules) {
  return progressionRules.filter(
    (progression) => Number(progression.statID) === Number(statId),
  )
}

/** @param {StatProgression[]} matching */
function pickNarrowestBracket(matching) {
  return matching.sort((left, right) => {
    const leftRange =
      (left.progressionMaxVal ?? Number.POSITIVE_INFINITY) -
      (left.progressionMinVal ?? Number.NEGATIVE_INFINITY)
    const rightRange =
      (right.progressionMaxVal ?? Number.POSITIVE_INFINITY) -
      (right.progressionMinVal ?? Number.NEGATIVE_INFINITY)

    return leftRange - rightRange
  })[0]
}

/** @param {StatProgression[]} progressions @param {StatProgression} bracket */
function findNextBracket(progressions, bracket) {
  const max = bracket.progressionMaxVal

  if (max === null || max === undefined) {
    return null
  }

  const candidates = progressions
    .filter(
      (progression) =>
        (progression.progressionMinVal ?? Number.NEGATIVE_INFINITY) > max,
    )
    .sort(
      (left, right) =>
        (left.progressionMinVal ?? Number.NEGATIVE_INFINITY) -
        (right.progressionMinVal ?? Number.NEGATIVE_INFINITY),
    )

  return candidates[0] ?? null
}

/**
 * @param {number | null | undefined} value
 * @param {StatProgression[]} progressions
 * @returns {StatProgression | null}
 */
export function findProgressionBracketForIncrease(value, progressions) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return null
  }

  const matching = progressions.filter((progression) => {
    const min = progression.progressionMinVal ?? Number.NEGATIVE_INFINITY
    const max = progression.progressionMaxVal ?? Number.POSITIVE_INFINITY

    return numericValue >= min && numericValue < max
  })

  if (matching.length) {
    return pickNarrowestBracket(matching)
  }

  const boundaryBracket = progressions.find(
    (progression) => progression.progressionMaxVal === numericValue,
  )

  if (boundaryBracket) {
    return findNextBracket(progressions, boundaryBracket)
  }

  return null
}

/**
 * @param {number | null | undefined} value
 * @param {StatProgression[]} progressions
 * @returns {StatProgression | null}
 */
export function findProgressionBracketForDecrease(value, progressions) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return null
  }

  const matching = progressions.filter((progression) => {
    const min = progression.progressionMinVal ?? Number.NEGATIVE_INFINITY
    const max = progression.progressionMaxVal ?? Number.POSITIVE_INFINITY

    return numericValue >= min && numericValue <= max
  })

  if (matching.length) {
    return pickNarrowestBracket(matching)
  }

  return null
}

/**
 * Neutral bracket lookup (inclusive on both bounds). Prefer directional helpers
 * for increase/decrease operations.
 *
 * @param {number | null | undefined} value
 * @param {StatProgression[]} progressions
 * @returns {StatProgression | null}
 */
export function findProgressionBracket(value, progressions) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return null
  }

  const matching = progressions.filter((progression) => {
    const min = progression.progressionMinVal ?? Number.NEGATIVE_INFINITY
    const max = progression.progressionMaxVal ?? Number.POSITIVE_INFINITY

    return numericValue >= min && numericValue <= max
  })

  if (!matching.length) {
    return null
  }

  return pickNarrowestBracket(matching)
}

/** @param {StatProgression | null | undefined} bracket */
function toProgressionResult(bracket) {
  if (!bracket) {
    return null
  }

  const increaseAmount = bracket.progressionIncAmt ?? 1
  const parsedIncrease = Number(increaseAmount)

  return {
    progressionId: bracket.progressionID,
    xpCost: toNumericValue(bracket.progressionXPCost),
    increaseAmount:
      Number.isFinite(parsedIncrease) && parsedIncrease > 0 ? parsedIncrease : 1,
  }
}

/**
 * @param {number | string} statId
 * @param {number | null | undefined} currentValue
 * @param {StatProgression[]} progressionRules
 * @param {Stat[]} [stats]
 * @returns {{ progressionId: number, xpCost: number, increaseAmount: number } | null}
 */
export function getProgressionForIncrease(statId, currentValue, progressionRules, stats = []) {
  const stat = findStat(statId, stats)

  if (stats.length && !stat) {
    return null
  }

  const numericValue = Number(currentValue)

  if (!Number.isFinite(numericValue)) {
    return null
  }

  const statMax = stat?.statMaxValue

  if (statMax !== null && statMax !== undefined && numericValue >= statMax) {
    return null
  }

  const progressions = getProgressionsForStatId(statId, progressionRules)
  const bracket = findProgressionBracketForIncrease(numericValue, progressions)

  return toProgressionResult(bracket)
}

/**
 * @param {number | string} statId
 * @param {number | null | undefined} currentValue
 * @param {StatProgression[]} progressionRules
 * @param {Stat[]} [stats]
 * @param {number | null | undefined} [baseValue]
 * @returns {{ progressionId: number, xpCost: number, increaseAmount: number } | null}
 */
export function getProgressionForDecrease(
  statId,
  currentValue,
  progressionRules,
  stats = [],
  baseValue = 0,
) {
  const stat = findStat(statId, stats)

  if (stats.length && !stat) {
    return null
  }

  const numericValue = Number(currentValue)

  if (!Number.isFinite(numericValue)) {
    return null
  }

  if (numericValue <= toNumericValue(baseValue)) {
    return null
  }

  const progressions = getProgressionsForStatId(statId, progressionRules)
  const bracket = findProgressionBracketForDecrease(numericValue, progressions)

  return toProgressionResult(bracket)
}

/**
 * @param {number | string} statId
 * @param {number | null | undefined} currentRank
 * @param {number | null | undefined} baseValue
 * @param {StatProgression[]} progressionRules
 * @returns {number}
 */
export function calculateStatTotal(statId, currentRank, baseValue, progressionRules) {
  const rank = Math.max(0, Math.floor(toNumericValue(currentRank)))
  const progressions = getProgressionsForStatId(statId, progressionRules)
  let current = toNumericValue(baseValue)

  for (let step = 0; step < rank; step += 1) {
    if (step >= MAX_PROGRESSION_STEPS) {
      throw new Error('Stat total calculation exceeded the maximum number of steps.')
    }

    const bracket = findProgressionBracketForIncrease(current, progressions)

    if (!bracket) {
      throw new Error(`No stat progression found for value ${current}.`)
    }

    const increaseAmount = bracket.progressionIncAmt ?? 1

    if (increaseAmount <= 0) {
      throw new Error('Stat progression increase amount must be greater than zero.')
    }

    current += increaseAmount
  }

  return current
}

/**
 * @param {number | string} statId
 * @param {number | null | undefined} currentRank
 * @param {number | null | undefined} baseValue
 * @param {StatProgression[]} progressionRules
 * @returns {number}
 */
export function calculateStatXpSpent(statId, currentRank, baseValue, progressionRules) {
  const rank = Math.max(0, Math.floor(toNumericValue(currentRank)))
  const progressions = getProgressionsForStatId(statId, progressionRules)
  let current = toNumericValue(baseValue)
  let totalXp = 0

  for (let step = 0; step < rank; step += 1) {
    if (step >= MAX_PROGRESSION_STEPS) {
      throw new Error('Stat XP calculation exceeded the maximum number of steps.')
    }

    const bracket = findProgressionBracketForIncrease(current, progressions)

    if (!bracket) {
      throw new Error(`No stat progression found for value ${current}.`)
    }

    const increaseAmount = bracket.progressionIncAmt ?? 1

    if (increaseAmount <= 0) {
      throw new Error('Stat progression increase amount must be greater than zero.')
    }

    totalXp += toNumericValue(bracket.progressionXPCost)
    current += increaseAmount
  }

  return totalXp
}

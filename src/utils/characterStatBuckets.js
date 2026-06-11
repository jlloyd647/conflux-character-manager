import {
  calculateStatTotal,
  findProgressionBracketForDecrease,
  findProgressionBracketForIncrease,
} from './statCalculation'
import { getStatIdForCharacterStat, getStatProgressionIncrement } from './statProgression'

/** @typedef {import('../services/statProgressionService').StatProgression} StatProgression */
/** @typedef {import('../services/statDefinitionService').Stat} Stat */

export const CHARACTER_STAT_BUCKET_KEYS = {
  vitality: ['vitality_1', 'vitality_2', 'vitality_3', 'vitality_4', 'vitality_5'],
  mind: ['mind_1', 'mind_2', 'mind_3', 'mind_4', 'mind_5'],
  strength: ['strength_1', 'strength_2', 'strength_3'],
  willpower: ['willpower_1', 'willpower_2', 'willpower_3'],
}

export const CHARACTER_STAT_PAGE_KEYS = Object.keys(CHARACTER_STAT_BUCKET_KEYS)

const CHARACTER_STAT_AGGREGATE_KEYS = {
  vitality: 'characterVitality',
  mind: 'characterMind',
  strength: 'characterStrength',
  willpower: 'characterWillpower',
}

const BLOODLINE_MIN_KEYS = {
  vitality: 'minVitality',
  mind: 'minMind',
  strength: 'minStrength',
  willpower: 'minWillpower',
}

const MAX_RANK_STEPS = 1000

/** @returns {string[]} */
export function getCharacterStatColumnNames() {
  return CHARACTER_STAT_PAGE_KEYS.flatMap(
    (statKey) => CHARACTER_STAT_BUCKET_KEYS[statKey],
  )
}

/** @param {unknown} value */
function mapNumericField(value) {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

/** @param {number | null | undefined} value */
function toNumericStatValue(value) {
  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : 0
}

/** @returns {Record<string, number[]>} */
export function createEmptyBucketValues() {
  return Object.fromEntries(
    CHARACTER_STAT_PAGE_KEYS.map((statKey) => [
      statKey,
      CHARACTER_STAT_BUCKET_KEYS[statKey].map(() => 0),
    ]),
  )
}

/**
 * @param {Record<string, unknown> | null | undefined} row
 * @returns {Record<string, number[]>}
 */
export function mapRowToBucketValues(row) {
  const buckets = createEmptyBucketValues()

  if (!row) {
    return buckets
  }

  for (const statKey of CHARACTER_STAT_PAGE_KEYS) {
    buckets[statKey] = CHARACTER_STAT_BUCKET_KEYS[statKey].map((column) =>
      mapNumericField(row[column]),
    )
  }

  return buckets
}

/** @param {number[] | null | undefined} bucketValues */
export function sumBucketValues(bucketValues) {
  return (bucketValues ?? []).reduce((total, value) => total + toNumericStatValue(value), 0)
}

/**
 * @param {Record<string, number[]>} bucketValues
 * @returns {Record<string, number>}
 */
export function bucketValuesToPageStats(bucketValues) {
  return Object.fromEntries(
    CHARACTER_STAT_PAGE_KEYS.map((statKey) => [
      statKey,
      sumBucketValues(bucketValues[statKey]),
    ]),
  )
}

/**
 * @param {Record<string, number[]>} bucketValues
 * @returns {Record<string, number>}
 */
export function bucketValuesToAggregateFields(bucketValues) {
  return Object.fromEntries(
    CHARACTER_STAT_PAGE_KEYS.map((statKey) => [
      CHARACTER_STAT_AGGREGATE_KEYS[statKey],
      sumBucketValues(bucketValues[statKey]),
    ]),
  )
}

/**
 * @param {Record<string, number[]>} bucketValues
 * @returns {Record<string, number>}
 */
export function bucketValuesToDbPayload(bucketValues) {
  const payload = {}

  for (const statKey of CHARACTER_STAT_PAGE_KEYS) {
    const columns = CHARACTER_STAT_BUCKET_KEYS[statKey]
    const values = bucketValues[statKey] ?? []

    columns.forEach((column, index) => {
      payload[column] = toNumericStatValue(values[index])
    })
  }

  return payload
}

/**
 * @param {string} statKey
 * @param {StatProgression[]} statProgressions
 * @param {Stat[]} stats
 */
function getProgressionsForStat(statKey, statProgressions, stats) {
  const statId = getStatIdForCharacterStat(statKey, stats)

  if (!statId) {
    return []
  }

  return statProgressions.filter(
    (progression) => Number(progression.statID) === Number(statId),
  )
}

/**
 * @param {number[] | null | undefined} bucketValues
 * @param {number} baseValue
 * @param {StatProgression[]} progressions
 */
function calculateRankFromBucketIncrements(bucketValues, baseValue, progressions) {
  const target = baseValue + sumBucketValues(bucketValues)
  let current = baseValue
  let rank = 0

  while (current < target) {
    if (rank >= MAX_RANK_STEPS) {
      break
    }

    current += getStatProgressionIncrement(current, progressions)
    rank += 1
  }

  return rank
}

/**
 * @param {string} statKey
 * @param {Record<string, number[]> | null | undefined} buckets
 * @param {Record<string, unknown> | null | undefined} bloodline
 * @param {StatProgression[]} statProgressions
 * @param {Stat[]} stats
 */
export function calculateDisplayedPageStat(
  statKey,
  buckets,
  bloodline,
  statProgressions,
  stats,
) {
  const minKey = BLOODLINE_MIN_KEYS[statKey]
  const baseValue = toNumericStatValue(bloodline?.[minKey])
  const statId = getStatIdForCharacterStat(statKey, stats)
  const progressions = getProgressionsForStat(statKey, statProgressions, stats)
  const bucketValues = buckets?.[statKey] ?? []

  if (!statId || !progressions.length) {
    return baseValue + sumBucketValues(bucketValues)
  }

  try {
    const rank = calculateRankFromBucketIncrements(
      bucketValues,
      baseValue,
      progressions,
    )

    return calculateStatTotal(statId, rank, baseValue, statProgressions)
  } catch {
    return baseValue + sumBucketValues(bucketValues)
  }
}

/**
 * @param {Record<string, number[]> | null | undefined} buckets
 * @param {Record<string, unknown> | null | undefined} bloodline
 * @param {StatProgression[]} statProgressions
 * @param {Stat[]} stats
 * @returns {Record<string, number>}
 */
export function calculateDisplayedPageStats(
  buckets,
  bloodline,
  statProgressions,
  stats,
) {
  return Object.fromEntries(
    CHARACTER_STAT_PAGE_KEYS.map((statKey) => [
      statKey,
      calculateDisplayedPageStat(
        statKey,
        buckets,
        bloodline,
        statProgressions,
        stats,
      ),
    ]),
  )
}

/**
 * @param {Partial<Record<string, number | null | undefined>>} pageStats
 * @returns {Record<string, number>}
 */
export function pageStatsToInitialBucketPayload(pageStats) {
  const bucketValues = createEmptyBucketValues()

  for (const statKey of CHARACTER_STAT_PAGE_KEYS) {
    const total = toNumericStatValue(pageStats[statKey])

    if (total !== 0) {
      bucketValues[statKey][0] = total
    }
  }

  return bucketValuesToDbPayload(bucketValues)
}

/**
 * @param {number} value
 * @param {StatProgression[]} progressions
 * @param {'increase' | 'decrease'} direction
 */
function getBracketIndex(value, progressions, direction) {
  const bracket =
    direction === 'decrease'
      ? findProgressionBracketForDecrease(value, progressions)
      : findProgressionBracketForIncrease(value, progressions)

  if (!bracket) {
    return 0
  }

  const sorted = [...progressions].sort(
    (left, right) =>
      (left.progressionMinVal ?? Number.NEGATIVE_INFINITY) -
      (right.progressionMinVal ?? Number.NEGATIVE_INFINITY),
  )

  const index = sorted.findIndex(
    (progression) => progression.progressionID === bracket.progressionID,
  )

  return index >= 0 ? index : 0
}

/**
 * @param {number[]} buckets
 * @param {string} statKey
 * @param {number} from
 * @param {number} to
 * @param {StatProgression[]} progressions
 */
function applyTotalChangeToBuckets(buckets, statKey, from, to, progressions) {
  const columnCount = CHARACTER_STAT_BUCKET_KEYS[statKey].length
  const result = [...buckets]

  while (result.length < columnCount) {
    result.push(0)
  }

  let current = toNumericStatValue(from)
  const target = toNumericStatValue(to)

  if (!progressions.length) {
    result.fill(0)
    result[0] = target
    return result
  }

  if (current < target) {
    while (current < target) {
      const increment = getStatProgressionIncrement(current, progressions, 'increase')
      const bucketIndex = Math.min(
        getBracketIndex(current, progressions, 'increase'),
        columnCount - 1,
      )

      result[bucketIndex] = toNumericStatValue(result[bucketIndex]) + increment
      current += increment
    }

    return result
  }

  if (current > target) {
    while (current > target) {
      const decrement = getStatProgressionIncrement(current, progressions, 'decrease')
      const bucketIndex = Math.min(
        getBracketIndex(current, progressions, 'decrease'),
        columnCount - 1,
      )

      result[bucketIndex] = Math.max(0, toNumericStatValue(result[bucketIndex]) - decrement)
      current -= decrement
    }
  }

  return result
}

/**
 * @param {Record<string, number[]>} existingBuckets
 * @param {Partial<Record<string, number | null | undefined>>} basePageStats
 * @param {Partial<Record<string, number | null | undefined>>} nextPageStats
 * @param {StatProgression[]} statProgressions
 * @param {Stat[]} stats
 * @returns {Record<string, number>}
 */
export function pageStatsToBucketPayload(
  existingBuckets,
  basePageStats,
  nextPageStats,
  statProgressions = [],
  stats = [],
) {
  const bucketValues = createEmptyBucketValues()

  for (const statKey of CHARACTER_STAT_PAGE_KEYS) {
    const progressions = getProgressionsForStat(statKey, statProgressions, stats)
    const from = toNumericStatValue(basePageStats[statKey])
    const to = toNumericStatValue(nextPageStats[statKey])
    const existing = existingBuckets[statKey] ?? []

    bucketValues[statKey] =
      from === to
        ? [...existing]
        : applyTotalChangeToBuckets(existing, statKey, from, to, progressions)
  }

  return bucketValuesToDbPayload(bucketValues)
}

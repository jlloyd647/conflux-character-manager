# Stat Progression Utility

## About Utility Specifications

Utility specifications define shared business logic used across the application. Their purpose is to centralize calculations and rules so that all pages, components, and services behave consistently.

## Purpose

Provide a single source of truth for stat progression calculations, stat rank calculations, XP calculations, and progression lookups.

---

## Responsibilities

What does this utility own?

- Finding the correct progression rule for a stat.
- Determining the correct progression_id for stat increases.
- Determining the correct progression_id for stat decreases.
- Calculating displayed stat totals from rank.
- Calculating total XP spent on a stat from rank.
- Validating stat minimum and maximum values.
- Providing progression metadata such as XP cost and increase amount.

---

## Does Not Own

What is explicitly outside the scope of this utility?

- Database operations.
- Character updates.
- Character creation.
- XP spending validation.
- UI rendering.
- Supabase queries.

---

## Inputs

The utility expects:

```js
statId
currentValue
currentRank
baseValue
progressionRules
stats
```

---

## Functions

### getProgressionForIncrease

Finds the progression rule that applies when increasing a stat.

Inputs:

```js
statId
currentValue
progressionRules
```

Returns:

```js
{
  progressionId,
  xpCost,
  increaseAmount
}
```

Example:

```txt
Vitality
Current Value: 55

Matching Rule:
51 - 70

Progression ID:
11
```

---

### getProgressionForDecrease

Finds the progression rule that applies when decreasing a stat.

Inputs:

```js
statId
currentValue
progressionRules
```

Returns:

```js
{
  progressionId,
  xpCost,
  increaseAmount
}
```

Example:

```txt
Strength
Current Value: 10

Matching Rule:
8 - 10

Progression ID:
8
```

---

### calculateStatTotal

Calculates the displayed stat value from rank.

Inputs:

```js
statId
currentRank
baseValue
progressionRules
```

Returns:

```js
number
```

Example:

```txt
Base Vitality: 10
Rank: 3

Rank 1: +5
Rank 2: +5
Rank 3: +5

Displayed Vitality:
25
```

---

### calculateStatXpSpent

Calculates total XP spent on a stat from rank.

Inputs:

```js
statId
currentRank
baseValue
progressionRules
```

Returns:

```js
number
```

Example:

```txt
Base Vitality: 10

Rank 1:
+5
Cost 1

Rank 2:
+5
Cost 1

Rank 3:
+5
Cost 1

Total XP Spent:
3
```

---

## Calculation Rules

### Stat Total Calculation

To calculate a stat total:

```txt
Start with the base stat value.

For each purchased rank:

Find the progression rule that applies to the current value.

Add the rule's increase amount.

Continue until all ranks have been processed.

Return the final value.
```

Example:

```txt
Base Value: 10

Rank 1:
10 -> 15

Rank 2:
15 -> 20

Rank 3:
20 -> 25

Result:
25
```

---

### XP Calculation

To calculate XP spent:

```txt
Start with the base stat value.

For each purchased rank:

Find the progression rule that applies to the current value.

Add the rule's XP cost.

Increase the current value by the rule's increase amount.

Continue until all ranks have been processed.

Return total XP spent.
```

Example:

```txt
Base Value: 10

Rank 1:
+5
Cost 1

Rank 2:
+5
Cost 1

Rank 3:
+5
Cost 1

Total XP:
3
```

---

## Character Stat Storage

The character_stats table should contain:

```txt
character_id
stat_id
current_rank
spent_xp
```

The database stores rank and spent XP.

Displayed stat totals should be calculated by the utility.

---

## Validation Rules

The utility should return null when:

- No matching stat exists.
- No matching progression rule exists.
- The stat is already at its maximum value when increasing.
- The stat is already at its minimum value when decreasing.

---

## Relationships

### Uses

- stats table
- stat_progression table
- character_stats table

### Used By

- Character Page
- Character Dashboard
- Character Service
- Character Stat Components

---

## Important Rule

This utility is the single source of truth for:

```txt
rank -> displayed stat total

rank -> spent stat XP

current value -> progression_id
```

All stat calculations should use this utility to ensure consistent behavior throughout the application.

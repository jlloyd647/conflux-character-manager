# Stat Progression

## What are Stat Progressions?

Stat progressions indicate the XP cost to the character to increase their stats by a given amount. Stats Progressions are done in batches, changing the cost dependant on the characters current stat value.

## Structure

### Stat Progressions have the following data structure in the database

- progression_id: int4
- stat_id: int4
- min_value: numeric
- max_value: numeric
- xp_cost: numeric
- increase_amount: numeric

### Banes will map to a more javascript friendly form when in the application

- progression_id | progressionID
- stat_id | statID
- min_value | progressionMinVal
- max_value | progressionMaxVal
- xp_cost | progressionXPCost
- increase_amount | progressionIncAmt

## Field Explanation

progression_id: A unique identifier to map progressions
stat_id: A unique identifier to map stat progressions to a stat
min_value: minimum needed value to fall into this stat progression category
max_value: maximum allowed value to fall into this stat progression category
xp_cost: Amount of XP needed to increase the stat while in this category
increase_amount: Amount a stat increases when purchased from within this category

## Data Location

- banes database in supabase

# CharacterStats

## What are Character Stats?

Character Stats are the numeric value of stats that each character pocesses

## Structure

### Character Stats have the following data structure in the database

- chracter_id: int4
- vitality: numeric
- mind: numeric
- strength: numeric
- willpower: numeric

### Banes will map to a more javascript friendly form when in the application

- characterID: | characterID
- vitality | characterVitality
- mind | characterMind
- strength | characterStrength
- willpower | characterWillpower

## Field Explanation

chracter_id: Unique identifier that maps a character to their mutable stats
vitality: Amount of damage a character can take
mind: Amount of abilities a character can use
strength: Amount of power a character pocesses
willpower: Amount of mental fortitude a character pocesses

## Data Location

- character_stats database in supabase

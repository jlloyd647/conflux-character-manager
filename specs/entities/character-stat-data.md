# CharacterStats

## What are Character Stats?

Character Stats are the numeric value of stats that each character pocesses

## Structure

### Character Stats have the following data structure in the database

- chracter_id: int4
- vitality_1: numeric
- vitality_2: numeric
- vitality_3: numeric
- vitality_4: numeric
- vitality_5: numeric
- mind_1: numeric
- mind_2: numeric
- mind_3: numeric
- mind_4: numeric
- mind_5: numeric
- strength_1: numeric
- strength_2: numeric
- strength_3: numeric
- willpower_1: numeric
- willpower_2: numeric
- willpower_3: numeric
- xp_spent: numeric

### Banes will map to a more javascript friendly form when in the application

- characterID: | characterID
- xp_spent | statXPSpent
- vitality_1 | characterVitality
- vitality_2 | characterVitality
- vitality_3 | characterVitality
- vitality_4 | characterVitality
- vitality_5 | characterVitality
- mind_1 | characterMind
- mind_2 | characterMind
- mind_3 | characterMind
- mind_4 | characterMind
- mind_5 | characterMind
- strength_1 | characterStrength
- strength_2 | characterStrength
- strength_3 | characterStrength
- willpower_1 | characterWillpower
- willpower_2 | characterWillpower
- willpower_3 | characterWillpower

## Field Explanation

chracter_id: Unique identifier that maps a character to their mutable stats
vitality 1 - 5: Amount of damage a character can take
mind 1 - 5: Amount of abilities a character can use
strength 1 - 3: Amount of power a character pocesses
willpower 1 - 3: Amount of mental fortitude a character pocesses
xp_spent: Running total of XP spent on stats, skills, and talents

## Data Location

- character_stats database in supabase

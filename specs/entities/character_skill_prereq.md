# Character Skill Prereq

## What are Character Skill Prereqs?

Some skills require the character to have already purchased a certain amount of skills from a specific type to purchases higher ranks. Both Talents and Social Type skills require this.

## Structure

### Stats have the following data structure in the database

- character_id: int8
- talent_r1: numeric
- talent_r2: numeric
- talent_r3: numeric
- social_r1: numeric
- social_r2: numeric
- social_r3: numeric

### Stats will map to a more javascript friendly form when in the application

- character_id | characterID
- talent_r1 | skillPrereqTalentR1
- talent_r2 | skillPrereqTalentR2
- talent_r3 | skillPrereqTalentR3
- social_r1 | skillPrereqSocialR1
- social_r2 | skillPrereqSocialR2
- social_r3 | skillPrereqSocialR3

## Field Explanation

character_id: Unique identifier to match a character with their character_skill_prereq data
talent_r1: The number of current rank 1 talents purchased
talent_r2: The number of current rank 2 talents purchased
talent_r3: The number of current rank 3 talents purchased
social_r1: The number of current rank 1 social skills purchased
social_r2: The number of current rank 2 social skills purchased
social_r3: The number of current rank 3 social skills purchased

## Data Location

- character_skill_prereq database in supabase

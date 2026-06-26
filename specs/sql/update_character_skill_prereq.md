# Update Character Skill Prereq Table

## Purpose

Stored procedure that updates the character-skill-prereq table based on what skill, skill type, and skill rank a player adds to their character.

## Tables

- */entites/character_skill_prereq.md

## Function

- If a skill is successfully added to the character-skill table, this stored procedure may increase the value of it's relevant column.
- If a skill is successfully removed from the character-skill table, this stored procedure may decrease the value of it's relevant column.
- Columns are labeled with the skill type name followed by the abreviated rank level. Example: social_r1 would match with a rank 1 social skill, social_r2 would match with a rank 2 social skill, etc...
- character_id should be the identifying column.

## Restrictions

- Only social skills (skill_type_id = 7) need to be tracked currently

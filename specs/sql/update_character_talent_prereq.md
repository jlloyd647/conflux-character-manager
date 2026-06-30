# Update Character Talent Prereq Table

## Purpose

Trigger that updates the character-skill-prereq table based on what talent and talent rank a player adds to their character.

## Tables

- */entites/character_skill_prereq.md

## Function

- If a talent is successfully added to the character-talent table, this trigger may increase the value of it's relevant column.
- If a talent is successfully removed from the character-talent table, this trigger may decrease the value of it's relevant column.
- Columns are labeled with the talent type name followed by the abreviated rank level. Example: talent_r1 would match with a rank 1 talent, talent_r2 would match with a rank 2 talent, etc...
- character_id should be the identifying column.

## Restrictions

## Feature Updates

1 - [x] - When changing bloodline, all talents are removed - We need to also reset talent_r1, talent_r2, and talent_r3 columns to 0 when this happens. 

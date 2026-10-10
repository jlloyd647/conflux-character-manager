# Add Bloodline Skill

## Purpose

Trigger that updates that adds specific skills based on the characters bloodline

## Tables

- */entities/skill_data.md

## Function

- Some bloodlines get free skills, if that bloodline is chosen that skill should be added to the character-skill table at an XP cost of 0
- Not all bloodlines get free skills, some get multiple free skills.
- This will not be editable through the GUI, only through the trigger / Function

## Restrictions

- This must happen after the character_id is generated

## Feature Updates
# Add Bloodline Lore

## Purpose

Trigger that adds specific lores based on the characters bloodline

## Tables

- */entities/lore-data.md
- */entities/character-lore-data.md

## Function

- Some bloodlines get free lores, if that bloodline is chosen that lore should be added to the character_lores table with is_free = true
- Not all bloodlines get free lores, some get multiple free lores.
- Free lores do not count toward the character's lore limit (LORES_PER_EDUCATION_SKILL per Education skill)
- Free lores are granted even if the character has no Education skill
- When the bloodline changes, the old bloodline's free lores are removed and the new bloodline's free lores are added
- Only is_free rows are removed on a bloodline change, so a lore the player chose is never deleted by the trigger
- Lores the character already has are not inserted twice
- This will not be editable through the GUI, only through the trigger / Function

## Restrictions

- This must happen after the character_id is generated

## Feature Updates

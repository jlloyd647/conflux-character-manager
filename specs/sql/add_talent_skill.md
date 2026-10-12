# Add Talent Skill

## Purpose

Trigger that adds a specific skill when a character takes a talent that grants it

## Tables

- */entities/skill_data.md
- */entities/talent-data.md

## Function

- Some talents give a free skill; each talent grants at most one skill
- When the talent is added to character_talent, the skill is added to the character-skill table with is_free = true at an XP cost of 0
- If the character already bought the skill, the existing row becomes free and the app refunds the XP that was charged for it
- When the talent is removed, the free skill is removed, unless another talent the character still owns grants the same skill
- The talent -> skill mapping is hardcoded in two places that must be kept in sync:
  - The VALUES list in `public.talent_granted_skill_id()` in `supabase/sql/add-talent-skill.sql` (grants and removes the skill)
  - `TALENT_GRANTED_SKILLS` in `src/utils/skillBuy.js` (removal checks and XP refund)
- This will not be editable through the GUI, only through the trigger / Function and the skillBuy constant

## Restrictions

- A skill granted by an owned talent cannot be removed on its own; remove the talent instead
- A talent cannot be removed if the skill it grants is a prereq for another skill the character owns
- Known limitation: if a bloodline or kingroup also grants the same skill, removing the talent removes that free row too

## Feature Updates

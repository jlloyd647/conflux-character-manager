# Skill Buy Utility

## Purpose

This utility exists to check restrictions that may exist when adding a skill to a character. It will be the layer that verifies the player has the necessary prereqs to add this skill to their chracter.

## Functions

checkXPCost: This function will verify that the character has the appropriate amount of XP to buy a given skill.
checkSkillPrereq: This function will check if a skill has a prerequisite skill required to purchase the current skill.
checkSkillRank: This function will check if the skill requires a certain number of previous skills of the same type are required to purchase this skill
checkBloodlineRestriction: This function will block a skill purchase if the character's bloodline is not allowed to buy that skill
getBloodlineSkillXPCost: This function returns a skill's XP cost after applying the character's bloodline modifier. It is used by checkXPCost, the skill picker, and characterService when charging / refunding XP.

## Rules

- If a skill has a null value for it's prereq_skill field, it does not have a prereq skill requirement
- If a skill has a null value for it's prereq_id field, it does not have a prereq rank requirement
- prereqs will exist in the referenceDataStore
- prereq_skill will exist in the referenceDataStore under each skill
- Bloodline skill restrictions are a blocklist kept in the BLOODLINE_RESTRICTED_SKILLS constant in src/utils/skillBuy.js ({ bloodlineID: [skillID, ...] })
- A bloodline with no entry in BLOODLINE_RESTRICTED_SKILLS has no restrictions
- Bloodline restrictions only block new purchases; skills a character already owns are left alone when their bloodline changes
- Bloodline XP cost changes are kept in the BLOODLINE_SKILL_XP_MODIFIERS constant in src/utils/skillBuy.js ({ bloodlineID: [rule, ...] })
- Each rule matches a skill by skillID or skillTypeID; if both a skillID rule and a skillTypeID rule match, the skillID rule wins
- A rule can have a multiplier (e.g. 0.5 for half cost, rounded up), a fixed delta (e.g. 1, 2, -3), or both; the multiplier is applied first, then the delta
- A bloodline-adjusted cost never goes below 1 XP
- Skills with a base cost of 0 stay free; bloodline rules do not apply to them
- Removing a skill refunds the adjusted cost for the character's current bloodline

## Relevant Databases

The character table has access to the character available XP and spent XP
The skill store has access to skills which have a prereq skill ID
The character_skill_prereq table uses the character_id to identify how many skills of a certain rank the character has already purchased.

## Agent Important Information

- Ask followup questions if something is unclear.

## Feature Updates

1 - [x] Exclusive skill sets

Some sets of skills only allow a character to own a limited number of skills from the set. Certain bloodlines are allowed to own more from a given set.

Data - an EXCLUSIVE_SKILL_SETS constant in src/utils/skillBuy.js:

```js
const EXCLUSIVE_SKILL_SETS = [
  {
    name: 'Set name',                 // shown in the purchase error message
    skillIDs: [1101, 1102, 1103],
    maxOwned: 1,                      // default: any 1 skill from the set
    bloodlineMaxOwned: { 7: 2 },      // { bloodlineID: limit } - bloodline 7 may own any 2
  },
]
```

Rules:

- A character may own any maxOwned purchased skills from a set
- bloodlineMaxOwned[bloodlineID] replaces maxOwned for that bloodline; it is the new total limit, not an amount added on top
- Which specific skills in a set a bloodline may combine is handled by bloodline talents, not here
- The bloodline limit can differ per set
- A skill may belong to more than one set; every set it belongs to must allow the purchase
- Only purchased skills count toward the limit. Skills granted for free by the bloodline / kingroup triggers do not count
- Removing a purchased skill from a set frees up a slot in that set
- Purchase error message: "You can only own {limit} skill(s) from {set name}." (falls back to "this skill set" when name is blank)

Functions:

- checkExclusiveSkillSet(characterSkills, skill, bloodlineID): returns a SkillBuyCheckResult; added to checkSkillPurchase
- isSkillBlockedBySet(characterSkills, skill, bloodlineID): boolean used by the skill picker

Skill picker:

- Skills blocked by a set are greyed out and not clickable, the same as bloodline-restricted skills
- No reason is shown on the row

Database - telling purchased skills apart from free skills:

- [x] Add an is_free boolean column to the character-skill table (added manually in Supabase)
- [x] add-bloodline-skill.sql and add-kingroup-skill.sql insert their free skills with is_free = true, and only remove is_free rows when the bloodline / kingroup changes
- [x] Backfill (supabase/sql/backfill-character-skill-is-free.sql): set is_free = true on existing character-skill rows that match a character's current bloodline / kingroup free skills; all other rows are set to false
- [x] Map is_free | isFree on CharacterSkill in characterService; purchases insert is_free = false
- [x] Only rows where is_free is not true count toward exclusive set limits (NULL is treated as purchased)
- [x] Removing an is_free skill refunds 0 XP, since no XP was paid for it

### Skill debarments

Owning certain skills debars the character from purchasing certain other skills.

```js
const SKILL_DEBARRED_SKILLS = {
  // skillID: [debarred skillID, ...]
}
```

- [x] SKILL_DEBARRED_SKILLS is hardcoded in skillBuy.js, like BLOODLINE_RESTRICTED_SKILLS
- [x] The block works both ways: owning the key skill blocks the listed skills, and owning a listed skill blocks the key skill
- [x] Any owned skill counts, purchased or free
- [x] checkSkillDebarment(characterSkills, skill, allSkills): added to checkSkillPurchase; message: "{skill} cannot be purchased with {owned skill}."
- [x] isSkillDebarredBySkill(characterSkills, skillID): debarred skills are greyed out and not clickable in the skill picker, the same as bloodline-restricted skills
- Free skills granted by the bloodline / kingroup / talent triggers are not blocked by debarments

### Talent-granted skills

Some talents give the character one skill for 0 XP. Spec: specs/sql/add_talent_skill.md

```js
export const TALENT_GRANTED_SKILLS = {
  // talentID: skillID
}
```

- [x] TALENT_GRANTED_SKILLS is hardcoded in skillBuy.js and must match public.talent_granted_skill_id() in supabase/sql/add-talent-skill.sql
- [x] getTalentGrantedSkillID(talentID): returns the granted skillID or null
- [x] The add-talent-skill trigger adds the skill with is_free = true when the talent is added, and removes it when the talent is removed
- [x] If the character already paid for the skill, adding the talent refunds that skill's XP cost (bloodline-adjusted) in the same XP change as the talent cost
- [x] checkSkillRemoval blocks removing a skill that an owned talent grants: "Cannot remove {skill}. It comes from the {talent} talent; remove the talent instead."
- [x] checkTalentRemoval also runs the skill prereq and rank checks for the granted skill, so a talent cannot be removed if its free skill is a prereq for something the character owns
- [x] The character page reloads its skills after adding or removing a talent that grants a skill

## Future

We need a way to check if a character can have more than a single specialization
Decide what happens to owned skills that become restricted when a character changes bloodline (likely part of a larger bloodline-change reset)
Refunds use the current bloodline's cost, so a skill bought under a different bloodline may refund a different amount than was paid (likely part of the same reset)

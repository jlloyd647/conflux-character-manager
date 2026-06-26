# Skill Buy Utility

## Purpose

This utility exists to check restrictions that may exist when adding a skill to a character. It will be the layer that verifies the player has the necessary prereqs to add this skill to their chracter.

## Functions

checkXPCost: This function will verify that the character has the appropriate amount of XP to buy a given skill.
checkSkillPrereq: This function will check if a skill has a prerequisite skill required to purchase the current skill.
checkSkillRank: This function will check if the skill requires a certain number of previous skills of the same type are required to purchase this skill

## Rules

- If a skill has a null value for it's prereq_skill field, it does not have a prereq skill requirement
- If a skill has a null value for it's prereq_id field, it does not have a prereq rank requirement
- prereqs will exist in the referenceDataStore
- prereq_skill will exist in the referenceDataStore under each skill

## Relevant Databases

The character table has access to the character available XP and spent XP
The skill store has access to skills which have a prereq skill ID
The character_skill_prereq table uses the character_id to identify how many skills of a certain rank the character has already purchased.

## Agent Important Information

- Ask followup questions if something is unclear.

## Future

We need a way to check if a character can have more than a single specialization
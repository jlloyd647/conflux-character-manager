# Skills

## What are skills?

Skills are abilities that a character can purchase with XP to do certain things within the game setting. Each skill has an XP cost, and can sometimes have additional costs to use the skill. This cost is the characters Mind or Will points. The skill consists of a name and a description that will be visible to the player within the application. Skills will be chosen by the player for a character and will be mapped using a character-skill bridge table.

## Structure

### Skills have the following data structure in the database

- skill_id: int8
- name: text
- description: text
- cost_will: int2
- cost_mind: int2
- cost_xp: int2
- prereq_skill_id: int8
- prereq_id: int8

### Skills will map to a more javascript friendly form when in the application

- skill_id | skillID
- name | skillName
- description | skillDescription
- cost_will | costWill
- cost_mind | costMind
- cost_xp | costXP
- prereq_skill_id | prereqSkillID
- prereq_id | prereqID

## Field Explanation

skill_id: Unique numeric identifier used for mapping to characters and as the primary skill key in the application
name: Name for the skill
description: Short description of what the skill does
cost_will: Resource cost for the player when using the skill
cost_mind: Resource cost for the player when using the skill
cost_xp: Resource cost for hte player to gain the skill
prereq_skill_id: Numeric skill ID of another skill required before this skill can be purchased
prereq_id: Numeric identifier for rank-based prerequisite requirements

## Feature Updates

1 - [x] - Add and accound for the following new table columns: prereq_skill_id, prereq_id
2 - [x] - Remove the id - I have replaced it with the skill_id as there is no need for two different IDs
3 - [x] - Remove the created_at field.

## Template for copy paste to agent - Ignore this section

I have added a feature update # to @specs/entities/skill-data.md - Please implement and mark with an x when completed.
# Skills

## What are skills?

Skills are abilities that a character can purchase with XP to do certain things within the game setting. Each skill has an XP cost, and can sometimes have additional costs to use the skill. This cost is the characters Mind or Will points. The skill consists of a name and a description that will be visible to the player within the application. Skills will be chosen by the player for a character and will be mapped using a character-skill bridge table.

## Structure

### Skills have the following data structure in the database

- id: uuid
- created_at: timestamptz
- skill_id: int8
- name: text
- description: text
- cost_will: int2
- cost_mind: int2
- cost_xp: int2

### Skills will map to a more javascript friendly form when in the application

- id | id
- created_at | createdAt
- skill_id | skillID
- name | skillName
- description | skillDescription
- cost_will | costWill
- cost_mind | costMind
- cost_xp | costXP

## Field Explanation

id: Unique identifier used for the purpose of data searching
created_at: Timestamp to verify when the skill was created
skill_id: Unique numeric identifier used for mapping to characters
name: Name for the skill
description: Short description of what the skill does
cost_will: Resource cost for the player when using the skill
cost_mind: Resource cost for the player when using the skill
cost_xp: Resource cost for hte player to gain the skill
# Talent

## What are talents?

Talents are a set of skills that are available to a player based on their bloodline.

## Structure

### Talents have the following data structure in the database

- talent_id: int4
- name: text
- description: text
- level: numeric
- xp_cost: numeric
- bloodline_id: int4

### Talents will map to a more javascript friendly form when in the application

talent_id | talentID
name | talentName
description | talentDescription
level | talentLevel
xp_cost | talentXPCost
bloodline_id | talentBloodlineID

## Field Explanation

stat_id: Unique numeric identifier used for mapping
name: Name for the stat
max_value: Maximum possible number that a player can reach

talent_id: Unique numeric identifier used for mapping
name: Name for the talent
description: Description for the talent
level: The talents level
xp_cost: The XP cost of the talent
bloodline_id: Determines which talents are displayed to and allowed to be chosen by a user based on their bloodline_id

## Data Location

- talents database in supabase

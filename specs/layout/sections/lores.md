# Approval Pending Character Section

## Purpose

A component that will show the player or admin which lores they currently have, as well as allow them to add or remove lores. 

## Layout

Layout should display all lores in a small box similar to skills when not in edit mode. In edit mode, there should be a table displaying all available lores for the character to select. 

## Data

The character lore data comes from the character-lore table in the database as defined by character-lores-data.md 

The lore data comes from the lore table in the database as defined by the lores-data.md

Once a user adds a lore, the character-lores table should be updated with the characterID and the loreId as pre the entity data in character-lores-data.md

Once a user removes a lore, the character-lores the relevant row in the character-lores table matching the characterID and the loreID should be deleted.

## Columns

- Lore Name

## Feature Updates

1 - [x] - Character is limited to lores based on how many skills the character currently has. For each of these skillID's [1087,1088,1089], the character may purchase 3 lores. A lore can only be purchased once. If a character does not have any of the listed skills, a box should display that states "Education L1 and above is required for skills"
2 - [x] - In add lore mode, the table should display only the Lore Name column.

## Bug Fixes

## Template for copy paste to agent - Ignore this section

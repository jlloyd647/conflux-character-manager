# Approval Pending Character Section

## Purpose

A component that will show the player or admin which formats they currently have, as well as allow them to add or remove formats. 

## Layout

Layout should display all formats in a small box similar to skills when not in edit mode. In edit mode, there should be a table displaying all available formats for the character to select. 

## Data

The character format data comes from the character-formats table in the database as defined by character-formats-data.md 

The format data comes from the formats table in the database as defined by the formats-data.md

Once a user adds a format, the character-formats table should be updated with the characterID and the formatID as per the entity data in character-formats-data.md

Once a user removes a format, the character-formats the relevant row in the character-formats table matching the characterID and the formatID should be deleted.

## Columns

- Format Name

## Feature Updates

1 - [x] - Character is limited to formats based on how many skills the character currently has. For each of these skillID's [1014,1015,1016], the character may purchase 1 format. If a character does not have any of the listed skills, a box should display that states "Specilization L1 and above is required for formats"

## Bug Fixes

## Template for copy paste to agent - Ignore this section

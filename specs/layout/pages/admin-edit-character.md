# EditCharacterPage

## Purpose

This page exists to allow admin users to view, edit, and create new characters for the game, saving or updating them to the characters Supabase table.

## Layout

This will be displayed in a form view and use the editableField component to display and edit the fields.

## Feature Updates

1 - [x] Add an area to display a list of character skills. The skills should use the getCharacterSkills call to the database passing in the characterID, then it should display the skillID as a list. The skills can be in the dozens so we need to make sure are creating an area to display skills properly.
2 - [x] Add an Add Skill button to the character skills area that changes to a table that displays skills when clicked. This should use the table component.
3 - [x] Update the skill button to show the name of the skill from the reference store rather then the skill id.
4 - [x] Using the bloodlines from the referenceDataStore, change hte bloodline ID to display the bloodline name instead.
5 - [x] Using the kingroups from the referenceDataStore, add a new DropdownField component labeled "Kin Group" that uses the character kingroup_id to display their kingroup name. If a user does not have a kingroup, display select kingroup.
6 - [x] Only display kingroups in the kingroup dropdown that have the same bloodline_id as the character.

## Bug Fixes

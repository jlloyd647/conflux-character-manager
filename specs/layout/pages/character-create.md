# EditCharacterPage

## Purpose

This page exists to allow player users to view, edit, and create new characters for the game, saving or updating them to the characters Supabase table.

## Layout

This will be displayed in a form view and use the editableField component to display and edit the fields. Once submitted, an admin will need to approve the character.

## Form Fields

- Character Name
- Bloodline
- Kin Group
- Backstory

## Feature Updates

1 - [x] - Update backstory to be below name, bloodline, and kingroup. It should be a text field rather then the editable textthat we have there now. It should be limited to 1000 characters.
2 - [x] - Add a place holder disclamer text below backstory to explain the approval process.
3 - [x] - Update to send player_id instead of id.
4 - [x] - Update backstory limit to 10000
5 - [x] - Add a dropdown asking "What is your preferred method of a Player Liaison reaching out to assist you with character creation?" as a label for the dropdown. The dropdown should have the following options [Discord, Email, I do not want to meet with a Player Liason]. The dropdown should go above backstory. These should map to 1, 2, and 3 in the database. If a players email or discord is not completed, please show a warning.
6 - [x] - When creating a character, we should be sending all 0's to character stats.
7 - [x] - Update the editable text fields to just be regular stylized text fields.

## Bug Fixes

## Template for copy paste to agent - Ignore this section

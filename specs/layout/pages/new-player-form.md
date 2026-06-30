# EditCharacterPage

## Purpose

This page exists to allow player users to view, edit, and create new characters for the game, saving or updating them to the characters Supabase table. If a user with the player role logs in and does not have an associated player in the players table, this page should be the default instead of dashboard.

## Layout

This will be displayed in a form view with standard input fields, a dropdown, and text areas. Once submitted it will create a new player in the players database on supabase.

## Form Fields

- Player First Name - Input Field
- Player Last Name - Input Field
- Player Pronouns - Input Field
- Player Email - Input Field
- Player Discord Username - Input Field
- Prefered Method of Contact - Dropdown [Discord, Email]
- How did you hear about Conflux - Text Field
- What made you interested in conflux - Text Field

## Feature Updates

1 - [x] - Do not use editable fields, just use regular fields for this page.
2 - [x] - Update How did you hear about conflux and what made you interested in conflux to be text boxes.
3 - [x] - Update Preferred Method of Contact to a standard stylized dropdown.
4 - [x] - Update to not allow submission without filling first name, last name, and email.
5 - [x] - When creating a new character the status should be updated to "Pending Approval"


## Bug Fixes

## Template for copy paste to agent - Ignore this section

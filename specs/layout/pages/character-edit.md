# EditCharacterPage

## Purpose

This page exists to allow player users to view and edit their character updating them to the characters Supabase table.

## Layout

The page is split into two tabs, Character Info and Character Sheet, as defined in layout/sections/character-sheet-tab.md. Character Info is the default tab.

The Character Info tab displays multiple sections that give players a handful of tools. Each section will occupy it's own space.

The Character Sheet tab will display the character's auto-filled PDF character sheet. Until the PDF template exists it displays a placeholder.

## Tabs

### Character Info (default)

- Character Info - Uneditable fields displaying the character ID, name, total XP, spent XP, bloodline, kin group, and the date created (mm/dd/yy)
- Character Stats - Editable stats similar to that on the admin edit character sheet
- Character Skills - Editable skills similar to that on the admin edit character sheet
- Talents- Editable talents similar to that on the admin edit character sheet
- Bloodline Gifts- Editable gifts similar to that on the admin edit character sheet
- Bloodline Banes- Editable banes similar to that on the admin edit character sheet
- Bloodline Curses- Editable curses similar to that on the admin edit character sheet

### Character Sheet

- Character Sheet - Auto-filled PDF of the character sheet, as defined in layout/sections/character-sheet-tab.md. Placeholder until the PDF template exists.

## Feature Updates

1 - [x] - Add a filter section to the top of Character Skills section, starting with a filter by name. It should be a wild card filter that can find the combination of letters anywhere in the name result.
2 - [x] - Add the filter section into the skills section so it looks like one cohesive element instead of two.
3 - [x] - Limit the size of the skills section height to be no more than 80% of the screen size and scrollable.
4 - [x] - Add checkboxes to filter by skill type, the types being [1 - Melee, 2 - Ranged, 3 - Magic, 4 - Crafting, 5 - Defensive, 6 - General, 7 - Social]
5 - [x] - Add the Lores section above talents as described in layout/sections/lores.md
6 - [x] - Move filter by skill type to the left of filter by name. 
7 - [x] - Move filter by skilly type to the right of filter by name.
8 - [x] - Clear filters when add skill or remove skill is clicked. Clear filters when a skill is added or a skill is removed.
9 - [x] - Only one section should be editable at a time - If any section is still in add or remove mode, and another add or remove is selected, cancel all other add or removes.
10 - [x] - I have added a new field to the character table, "status". It should match with the statuses that we wrote previously and should be displayed in the character info section
11 - [x] - Hide and disable the Remove Skill button if a character is not in status 7 or 8.
12 - [x] - Hide and disable the Remove Talent, Remove Lore, and the "reduce" button for character stats, Vitality, Mind, Strength, and Willpower button if a character is not in status 7 or 8.
13 - [x] - I need a new section as defined by sections/formats.md - This section should go above lores.
14 - [x] - Split the page into Character Info and Character Sheet tabs as defined by sections/character-sheet-tab.md. All existing sections move into the Character Info tab unchanged.
15 - [x] - Move the "Back to Dashboard" link onto the same line as the page title, aligned to the right.
16 - [x] - Remove the "Character Info" heading above the character info card.
17 - [x] - Page title shows the character's name for players (falls back to "Character" while loading). Admins see "Edit Character".

## Bug Fixes

## Template for copy paste to agent - Ignore this section

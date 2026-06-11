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
7 - [x] Add an area to display a list of blood line banes. The banes should come from the banes in ReferenceDataStore and should only display banes that match the characters bloodline_id.
8 - [x] Add an area to display a list of blood line gifts. The gifts should come from the gifts in ReferenceDataStore and should only display gifts that match the characters bloodline_id.
9 - [x] Add an area to display a list of blood line curses. The curses should come from the curses in ReferenceDataStore and should only display curses that match the characters bloodline_id.
10 - [x] Add four new editableFields components, Strength, Vitality, Mind, and Willpower. These fields should be set to not be editable and should display the minStrength, minVitality, minMind, and minWillpower for the characters bloodline.
11 - [x] Add an area to display character stats, Vitality, Mind, Strength, and Willpower. Use the NumericField component to display these stats. Remove Vitality, Mind, Strength, and Willpower from the character portion of the admin page.
12 - [x] Remove the characterID as an editable field and put it to the left of the player name, sperated by a |
13 - [x] Remove the playerID as an editable field and put it to the right of the player name, seperated by a -
14 - [x] Add a bit more space between the CharacterID, Name, and playerID. About 15px.
15 - [x] Add a remove skills button next to the add skills button that displays a list of skills the character has, if a skill is clicked that skill is removed from the character-skill list in the database.
16 - [x] When a user adds or removes a skill, we will need to update the xp_spent field in the database to match the xp_cost of that skill.
17 - [x] Update XP editable field title to "Total XP", add a new editableField that is not editable to show "Spent XP"
18 - [x] Increasing or decreasing a stat should go up in incriments equal to the progressionIncAmount, not just 1. This is based on the current value of the stat and where it falls in the stat-progression for the same stat id.
        Example: If Vitality is currently 20, that is less then the max_value, there fore it should increase by 5, the progressionIncAmount. But if it was 40, then it should only increase by 2, the progressionIncAmount for that stat range, because it fell between 31-50
19 - [x] Changing character stats will incur an XP cost based on the stat-progression in reference data. We need to keep a running total of xp spent while increase or decreasing the stats here, then when the confirm button is hit, we need to update the xp_spent in the database.
20 - [x] Adjust the threshold for increasing and decreasing by ammount to be <max rather than <=max
21 - [x] Adjust the threshold for increasing and decreasing by amount to be <=max rather than <max
22 - [x] For Vitality, Mind, Strength, and Willpower, we should be displaying the blood minimums plus the rank calculation from the stat-calulation utils.

## Bug Fixes

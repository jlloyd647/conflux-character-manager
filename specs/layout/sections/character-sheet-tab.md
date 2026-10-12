# Character Sheet Tab

## Purpose

A tab on the character page that will display the character's official character sheet as a PDF, automatically filled in from the character's data in the database. The PDF template does not exist yet, so for now the tab displays a placeholder.

## Layout

The character page is split into two tabs at the top of the page, below the page header:

- Character Info - The default tab. Contains every existing section of the character page (Character Info, Character Stats, Character Skills, Lores, Talents, Bloodline Gifts, Bloodline Banes, Bloodline Curses) exactly as they are today.
- Character Sheet - Displays the filled character sheet PDF. Until the template has form fields, displays the blank template in the browser's built-in PDF viewer, with a link to open it in a new tab if it does not display.

Only one tab's content is visible at a time. The active tab is visually highlighted.

## Data

### Current

None. The tab displays the blank template from `public/pdfs/ConfluxCharacterSheet20.pdf`. The PDF is only loaded when the Character Sheet tab is open.

### Future

The PDF will be filled from data the character page already loads:

- Character - name, character ID, player, bloodline, kin group, total XP, spent XP, status (characters.md / character-data.md)
- Stats - Vitality, Mind, Strength, Willpower as displayed totals (bloodline minimum plus purchased ranks) (character-stat-data.md)
- Skills, Lores, Talents - names of everything the character owns
- Bloodline Gifts, Banes, Curses - from the reference data store, filtered by the character's bloodline

### PDF Template

- File: `public/pdfs/ConfluxCharacterSheet20.pdf` (served at `/pdfs/ConfluxCharacterSheet20.pdf`)
- 4 pages, landscape US Letter (792 x 612 pt), exported from a spreadsheet
- The template is filled in the browser. No server is involved
- Data is written into named PDF form fields. The template does not have form fields yet; they will be added in a PDF editor using the field names below
- Fields the app has no data for stay blank so they can be written in by hand

### Field Mapping

Repeating rows are numbered from 1, top to bottom. Two-column tables number down the left column first, then continue down the right column.

Page 1

| PDF field | App data |
| --- | --- |
| player_name | Player's name (players table) |
| character_name | characters.character_name |
| player_id | characters.player_id |
| bloodline | Bloodline name |
| kingroup | Kin group name |
| total_xp | characters.xp |
| available_xp | characters.xp minus character_stats.xp_spent |
| strength, willpower, max_vitality, max_mind | Displayed stat totals (bloodline minimum plus purchased ranks) |
| talent_1 ... talent_20 | Talent names |
| bane_major_1 ... bane_major_4 | Banes where is_major is true |
| bane_minor_1 ... bane_minor_4 | Banes where is_major is false |
| gift_1 ... gift_5 | Gift names |
| curse_1 ... curse_5 | Curse names |
| combat_safety, die_type, die_changed_to, staff_notes, current_strength, current_willpower, current_vitality, current_mind | No app data - left blank |

Page 2 - Non-Magical Skills

| PDF field | App data |
| --- | --- |
| skill_name_1 ... skill_name_56 | Skill name |
| skill_use_cost_1 ... skill_use_cost_56 | cost_mind / cost_will (for example "2 Mind") |
| skill_xp_cost_1 ... skill_xp_cost_56 | XP cost (see Open Questions) |

Page 3

| PDF field | App data |
| --- | --- |
| magic_name_1 ... magic_name_28 | Magical skill name (see Open Questions) |
| magic_use_cost_1 ... magic_use_cost_28 | cost_mind / cost_will |
| magic_xp_cost_1 ... magic_xp_cost_28 | XP cost (see Open Questions) |
| specialization_1 ... specialization_10 | See Open Questions |
| lore_1 ... lore_17 | Lore names |

Page 4 - Known Spells, Need to Feed, Attuned Magic Items: no app data. No fields required.

Row counts above come from the template's current layout. The app fills numbered fields starting at 1 and stops at the first number that does not exist in the PDF, so rows can be added to or removed from the template without code changes. Fields missing from the PDF are skipped rather than treated as errors. If a character has more entries than a table has rows, the extra entries are not shown on the sheet (see Open Questions).

Once the PDF is displayed, the tab will offer two actions:

- Download - Saves the filled PDF, named after the character (for example `character-sheet-<character name>.pdf`)
- Print - Opens the browser print dialog for the filled PDF

## Rules

- Character Info is the default tab when the page opens
- The active tab is stored in the URL as a query parameter (`?tab=info` or `?tab=sheet`) so a refresh or shared link opens the same tab. A missing or unknown value opens Character Info
- Tabs are shown on both the player character page and the admin character edit page
- Tabs are only shown for an existing character. Character creation (`/characters/create`) does not show tabs
- Switching tabs must not discard unsaved work on the Character Info tab (stat edits in progress, open add/remove modes). Character Info content stays mounted while hidden
- The Character Sheet tab is read-only. It never writes to the database
- The Character Sheet tab only displays data the viewer is already allowed to see on the Character Info tab (same access rules as the page)

## Relationships

- character-edit.md - The character page that hosts the tabs
- admin-edit-character.md - Uses the same character page component
- character-data.md, character-stat-data.md - Future PDF data sources
- reference-data-store.md - Future source for bloodline gifts, banes, and curses

## Open Questions

- Which skills belong in the page 3 Magical Format table versus the page 2 Non-Magical Skills table? (One option: skill type 3, Magic, on page 3)
- Should the skill XP Cost columns show the skill's base cost, or what the character actually paid (free bloodline/kin group skills as 0, bloodline discounts applied)?
- What goes in the page 3 Specializations box? (One option: the character's specialization formats, currently hidden)
- What should happen when a character has more entries than a table has rows (for example more than 20 talents)?
- The page 4 Known Spells boxes contain visible `#REF!` spreadsheet errors that print on every sheet. Fix them in the source spreadsheet and re-export the template

## Decisions

- The PDF is filled client side, in the browser
- The blank template lives in the app's public files (`public/pdfs/`), versioned with the code
- Data is written into named PDF form fields rather than drawn at page coordinates

## Feature Updates

1 - [x] - Split the character page into two tabs, Character Info and Character Sheet, as described in Layout and Rules. The Character Sheet tab displays the placeholder message.
2 - [x] - Replace the placeholder with the blank PDF template, displayed in the browser's built-in PDF viewer. Include a link to open the PDF in a new tab.

## Bug Fixes

## Template for copy paste to agent - Ignore this section

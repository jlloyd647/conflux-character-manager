# Character Lore Data

## What are Character Lores?

Character lores are the bridge table that maps which lores which characters have through the use of characterID

## Structure

### Lores have the following data structure in the database

- character_id: int4
- lore_id: int4
- is_free: boolean

### Gifts will map to a more javascript friendly form when in the application

- character_id | characterID
- lore_id: | loreID
- is_free | isFree

## Field Explanation

character_id: Foreign key that maps to the characters table
lore_id: Foreign key that maps to the lores table
is_free: True when the lore was granted for free by the bloodline lore trigger (specs/sql/add_bloodline_lore.md). Free lores do not count toward the lore limit

## Data Location

- character_lores database in supabase

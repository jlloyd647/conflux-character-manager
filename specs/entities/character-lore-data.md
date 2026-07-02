# Character Lore Data

## What are Character Lores?

Character lores are the bridge table that maps which lores which characters have through the use of characterID

## Structure

### Lores have the following data structure in the database

- character_id: int4
- lore_id: int4

### Gifts will map to a more javascript friendly form when in the application

- character_id | characterID
- lore_id: | loreID

## Field Explanation

character_id: Foreign key that maps to the characters table
lore_id: Foreign key that maps to the lores table

## Data Location

- character_lores database in supabase

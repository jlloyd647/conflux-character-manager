# Character Formats Data

## What are Character Formats?

Character formats are the bridge table that maps which formats which characters have through the use of characterID

## Structure

### Formats have the following data structure in the database

- character_id: int4
- format_id: int4

### Formats will map to a more javascript friendly form when in the application

- character_id | characterID
- format_id: | formatID

## Field Explanation

character_id: Foreign key that maps to the characters table
format_id: Foreign key that maps to the formats table

## Data Location

- character_formats database in supabase

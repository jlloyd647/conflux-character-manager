# Row Status

## What are Row Statuses?

Row statuses are what we use to map specific conditions to rows within the database

## Structure

### Banes have the following data structure in the database

- id: int4
- status_name: text

### Banes will map to a more javascript friendly form when in the application

- id: | rowStatusID
- status_name | statusName

## Field Explanation

id: Unique numeric identifier used for mapping
status_name: Name for the Row Status

## Data Location

- row_status database in supabase

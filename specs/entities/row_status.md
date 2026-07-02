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

## Known Status Codes

| ID | Application constant | Name |
| --- | --- | --- |
| 1 | ACTIVE | Active |
| 2 | PENDING_APPROVAL | Pending Approval |
| 3 | INACTIVE | Inactive |
| 4 | DELETED | Deleted |
| 5 | PROBATION | Probation |
| 6 | BANNED | Banned |
| 7 | NEW | New |
| 8 | REROLL | Reroll |

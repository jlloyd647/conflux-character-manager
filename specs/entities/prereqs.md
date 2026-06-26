# Prereqs

## What are prereqs?

Some skills require a number of skills purchased within the same type to buy higher ranked skills. Prereqs table helps define those skills.

## Structure

### Banes have the following data structure in the database

- prereq_id: int2
- required_ranks: numeric
- ranks: text
- message: text

### Banes will map to a more javascript friendly form when in the application

- prereq_id | prereqID
- required_ranks | prereqRequiredRanks
- ranks | prereqRanks
- message | prereqMessage

## Field Explanation

prereq_id: Unique identifier to map skills that have prereqs to the prereqs table
required_ranks: The number of skills within a specific type that need to purchased before a skill can be purchased.
ranks: The rank and type of skill that matches the column of the character_skill_prereq
message: The message that should be displayed when a character does not meet the required prereq contraint

## Data Location

- prereqs database in supabase

## Feature Updates

1 - [x] - Display the message when a user does not meet the requirements for a skill or talent purchase, default to current if no message is set.

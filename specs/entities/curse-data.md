# Curse

## What are curses?

Curses are benefits the character gets based on their selected bloodline.

## Structure

### Curses have the following data structure in the database

- curse_id: int4
- bloodline_id: int4
- name: text
- description: text

### Curses will map to a more javascript friendly form when in the application

- curse_id: | curseID
- bloodline_id | bloodlineID
- name | baneName
- description | baneDescription

## Field Explanation

curse_id: Unique numeric identifier used for mapping
bloodline_id: Unique numeric identifier used for mapping to bloodlines
name: Name for the curse
description: Description of the curse

## Data Location

- curses database in supabase

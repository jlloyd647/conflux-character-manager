# Bane

## What are banes?

Banes are deteriments that are assigned to a character based on their bloodline.

## Structure

### Banes have the following data structure in the database

- bane_id: int4
- bloodline_id: int4
- name: text
- description: text
- is_major: bool

### Banes will map to a more javascript friendly form when in the application

- bane_id: | baneID
- bloodline_id | bloodlineID
- name | baneName
- description | baneDescription
- is_major | isMajor

## Field Explanation

bane_id: Unique numeric identifier used for mapping
bloodline_id: Unique numeric identifier used for mapping to bloodlines
name: Name for the bane
description: Description of the bane
isMajor: Marks whether a bane is a major or minor bane

## Data Location

- banes database in supabase

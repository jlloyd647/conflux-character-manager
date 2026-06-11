# Kingroup

## What are kingroups?

Kingroups are a archtype that aligns to a character to give them different aesthetics within the game.

## Structure

### Kingroups have the following data structure in the database

- kingroup_id: int4
- bloodline_id: int4
- name: text

### Bloodlines will map to a more javascript friendly form when in the application

- kingroup_id: | kingroupID
- bloodline_id | bloodlineID
- name | bloodlineName

## Field Explanation

kingroup_id: Unique numeric identifier used for mapping to characters
bloodline_id: Unique numeric identifier used for mapping to bloodlines
name: Name for the bloodline

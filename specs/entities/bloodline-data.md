# Bloodlines

## What are bloodlines?

Bloodlines are a archtype that aligns to a character to give them different advantages and disadvantages within the game.

## Structure

### Skills have the following data structure in the database

- bloodline_id: int4
- name: text

### Bloodlines will map to a more javascript friendly form when in the application

- bloodline_id | bloodlineID
- name | bloodlineName

## Field Explanation

bloodline_id: Unique numeric identifier used for mapping to characters
name: Name for the bloodline

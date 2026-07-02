# Formats

## What are formats?

Formats are a skill that characters can purchase if they purchase the relevant specilization skill.

## Structure

### Lores have the following data structure in the database

- format_id: int4
- name: text

### Gifts will map to a more javascript friendly form when in the application

- format_id: | formatID
- name | formatName

## Field Explanation

format_id: Unique numeric identifier used for mapping
name: Name for the format

## Data Location

- formats database in supabase

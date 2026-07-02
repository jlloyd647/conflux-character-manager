# Lore

## What are lores?

Lores are a skill that characters can purchase if they purchase the relevant education skill. 

## Structure

### Lores have the following data structure in the database

- lore_id: int4
- name: text

### Gifts will map to a more javascript friendly form when in the application

- lore_id: | loreID
- name | loreName

## Field Explanation

lore_id: Unique numeric identifier used for mapping
name: Name for the gift

## Data Location

- lores database in supabase

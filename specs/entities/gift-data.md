# Gift

## What are gifts?

Gifts are benefits the character gets based on their selected bloodline.

## Structure

### Gifts have the following data structure in the database

- gift_id: int4
- bloodline_id: int4
- name: text
- description: text

### Gifts will map to a more javascript friendly form when in the application

- gift_id: | giftID
- bloodline_id | bloodlineID
- name | baneName
- description | baneDescription

## Field Explanation

gift_id: Unique numeric identifier used for mapping
bloodline_id: Unique numeric identifier used for mapping to bloodlines
name: Name for the gift
description: Description of the gift

## Data Location

- gifts database in supabase

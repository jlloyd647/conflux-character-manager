# Stat

## What are stats?

Stats are numeric representations of different strengths and weaknesses a player posses

## Structure

### Stats have the following data structure in the database

- stat_id: int4
- name: text
- max_value: numeric

### Stats will map to a more javascript friendly form when in the application

- stat_id: | statID
- name | statName
- max_value | statMaxValue

## Field Explanation

stat_id: Unique numeric identifier used for mapping
name: Name for the stat
max_value: Maximum possible number that a player can reach

## Data Location

- stats database in supabase

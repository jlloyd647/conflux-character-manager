# Bloodlines

## What are bloodlines?

Bloodlines are a archtype that aligns to a character to give them different advantages and disadvantages within the game.

## Structure

### Skills have the following data structure in the database

- bloodline_id: int4
- name: text
- min_strength: numeric
- max_strength: numeric
- min_vitality: numeric
- max_vitality: numeric
- min_mind: numeric
- max_mind: numeric
- min_willpower: numeric
- max_willpower: numeric

### Bloodlines will map to a more javascript friendly form when in the application

- bloodline_id | bloodlineID
- name | bloodlineName
- min_strength | minStrength
- max_strength | maxStrength
- min_vitality | minVitality
- max_vitality | maxVitality
- min_mind | minMind
- max_mind | maxMind
- min_willpower | minWillpower
- max_willpower: | maxWillpower

## Field Explanation

bloodline_id: Unique numeric identifier used for mapping to characters
name: Name for the bloodline
minStrength: numeric
maxStrength: numeric
minVitality: numeric
maxVitality: numeric
minMind: numeric
maxMind: numeric
minWillpower: numeric
maxWillpower: numeric

# NumericField

## Purpose

Exists as a UI component to display the numeric data, then when in edit model will allow a user to raise or lower the numeric value within. Once a selection is made and confirmed an update is made in the database.

## Layout

There will be a label above, a text field below. When in edit mode, a - button will exist on the left of the value, a + button will exist on the right. 

## Functions

- Edit mode will be toggled by a seperate button and will be toggled for a group of NumericFields rather than just a single numeric field.
- Edit mode will display a - and plus button
- - button will decrease the number
- + button will increase the number
- Numbers will have a minimum and maximum value, greying out the + and - buttons if that value is reached
- an external confirm button will send all grouped value changes to update the database accordingly.

## Feature Updates

1 - [x] Update the + and - buttons to handle custom functions as well. If no function is defined, have it increase or decrease the number within.

## Notes
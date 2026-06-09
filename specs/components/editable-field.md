# Editable Display Field

## Purpose

Provides a reusable inline editing component that displays a value until edited.

The component displays a value and edit icon. When editing, the value becomes an input field with save and cancel actions.

---

## Responsibilities

- Display a value
- Render edit action
- Switch between display and edit mode
- Manage temporary edited value
- Render save and cancel actions
- Execute provided save callback
- Handle loading and error states
- Revert changes when cancelled

---

## Does Not Own

- Database implementation
- Supabase configuration
- Authentication
- Authorization
- Entity validation rules
- Application state management

---

## Relationships

- Player Entity
- Player Dashboard
- Supabase Service Layer

---

## Requirements

### Display Mode

- Show current value
- Show edit icon

### Edit Mode

- Show input field
- Show save icon
- Show cancel icon

### Save

- Call provided save handler
- Update displayed value on success
- Display error on failure

### Cancel

- Restore original value
- Exit edit mode
- Do not save changes

## Feature Updates

1 - [x] Add a prop to move just the edit button next to the field rather then next to the display text. Update editable fields on the Edit Skill page to do this.
2 - [x] Make the label field optional and update the Name field on the Edit Skill Page to not display the label, and update the button to show up next to the input again.
3 - [x] Make he size of the input text editable using pixel units and increase the size of the Name Field on the Edit Skill Page to 36 px
4 - [x] If no change is made to the value and check is clicked, do not update the database.

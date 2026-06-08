# Project Structure

## Purpose

Defines ownership boundaries for folders within the application.

The goal is to ensure files are created in predictable locations and responsibilities remain separated as the application grows.

---

## Rules

- Files should only be created in folders that own their responsibility
- Avoid duplicate responsibilities across folders
- Business logic should not live in UI components
- Database access should be centralized through services
- Pages compose features but do not implement reusable UI

---

## src/pages

### Owns

- Route-level pages
- Page composition
- Page-specific data loading
- Page-specific layout decisions

### Does Not Own

- Reusable UI components
- Database access
- Shared business logic

### Examples

```text
DashboardPage.jsx
CharacterPage.jsx
AdminPage.jsx
```

---

## src/components

### Owns

- Reusable UI components
- Visual presentation
- User interactions

### Does Not Own

- Database access
- Business rules
- Routing

### Examples

```text
CharacterCard.jsx
SkillList.jsx
Modal.jsx
Button.jsx
```

---

## src/services

### Owns

- Database operations
- API interactions
- Supabase communication
- Data persistence

### Does Not Own

- UI rendering
- React state

### Examples

```text
characterService.js
skillService.js
authService.js
```

---

## src/hooks

### Owns

- Shared React hooks
- Reusable stateful logic

### Does Not Own

- UI rendering
- Database schema definitions

### Examples

```text
useCharacter.js
useCurrentUser.js
```

---

## src/layouts

### Owns

- Shared application layouts
- Page shells
- Navigation placement

### Does Not Own

- Page functionality
- Business logic

### Examples

```text
PublicLayout.jsx
AppLayout.jsx
```

---

## src/routes

### Owns

- Route configuration
- Route registration
- Route guards

### Does Not Own

- Page implementation

### Examples

```text
AppRoutes.jsx
ProtectedRoute.jsx
```

---

## src/contexts

### Owns

- Application-wide context providers

### Does Not Own

- Database access
- Page rendering

### Examples

```text
AuthContext.jsx
ThemeContext.jsx
```

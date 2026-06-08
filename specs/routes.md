# Routes

## Purpose

Routes define how the application maps URLs to page-level views through React Router.

Routes are responsible for determining which page is displayed based on the current URL and applying the appropriate layout and access control wrapper.

## Responsibilities

- Register application routes
- Map URLs to page components
- Apply shared layouts to page groups
- Support public, authenticated, staff, and admin route groups
- Handle route-level access restrictions
- Pass route parameters to pages through React Router
- Display the correct page for the current URL

---

## Does Not Own

- Individual page functionality
- Business logic
- Data fetching
- State management
- Form handling
- Component implementation details
- Database interactions
- Authorization rules beyond route-level access checks

---

## Relationships

- route-registry.md
- header.md

--

## Rules

- Routes only determine what page should be displayed
- Routes should not contain business logic
- Routes should not directly fetch data
- Routes should not modify page state
- Routes should not validate forms
- Routes should not perform database writes
- Pages are responsible for their own data and behavior
- Shared layouts should be applied through route configuration
- Protected routes must validate access before rendering protected pages
- Route parameters should be read by pages using React Router tools
- Routes should remain lightweight and focused on navigation

---

## Feature Requests

## Bug Fixes

## Future Considerations

Ideas that may be explored later but are not currently approved.

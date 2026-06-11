# Player Service

## Purpose

Provide a centralized service responsible for player-related operations throughout the application.

The Player Service exists to create a single source of truth for retrieving, creating, updating, and managing character records while insulating the rest of the application from direct database implementation details.

## Responsibilities

What does this own?

- Retrieving character records
- Retrieving individual character details
- Creating character records
- Updating character records
- Deactivating character records
- Character profile management
- Mapping database responses into application models
- Handling character-related API interactions
- Providing character data to pages and components
- Managing character role assignments
- Managing character status values

---

## Does Not Own

What is explicitly outside the scope of this document?

- Authentication
- User login
- User registration
- Password management
- Session management
- Authorization enforcement
- UI rendering
- Form validation
- Player management
- Event management
- Direct component state management
- Database schema ownership

---

## Relationships

What other specifications interact with this one?

- User Service
- Authentication Service
- Player Service
- Event Service
- Admin Dashboard
- Character Management Page
- Supabase Integration

---

## Rules

Non-negotiable constraints.

- All character-related data access must flow through the Character Service.
- Components must not directly query character tables.
- Pages must consume Character Service methods rather than database clients.
- The service must return predictable, typed responses.
- Database implementation details must remain hidden from consumers.
- The service must support future backend changes without requiring page-level modifications.
- The service must not contain presentation logic.
- The service must not directly render UI.

---

## Feature Updates

1 - [x] add a function getCharacterSkills to the service that calls to the character-skill table where using the character id as the identifier. Be sure to use the character_id not the id.
2 - [x] add a function to addCharacterSkills to the service that calls to the character-skill table wending over both the characterID and the skillID

---

## Bug Fixes

---

## Future Considerations

Ideas that may be explored later but are not currently approved.

- Character search functionality
- Character filtering
- Character audit history
- Character notes
- Character tags
- Bulk character updates
- Character import/export
- Caching strategies
- Offline support
- Analytics integrations

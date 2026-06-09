# Player Dashboard

## Purpose

Provide the main landing page for a logged-in player.

The Player Dashboard gives players access to their profile, characters, upcoming events, and relevant game information.

---

## Data Dependencies

This page maps to the Player Entity.

```ts
type Player = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  preferredName: string;
  pronouns: string;
  email: string;
  role: PlayerRole;
  status: PlayerStatus;
  discordUsername: string;
  createdAt: string;
  updatedAt: string;
};
```

---

## Responsibilities

What does this page own?

- Displaying the logged-in player's basic profile information
- Displaying player role and status
- Providing navigation to player-owned characters
- Providing navigation to available events
- Showing player-specific dashboard content
- Handling empty states for missing player data

---

## Does Not Own

What is explicitly outside the scope of this document?

- Player authentication
- Player registration
- Password management
- Editing player data
- Creating or editing characters
- Creating or editing events
- Admin-only player management
- Direct Supabase queries
- Player data model definition

---

## Player Entity Field Usage

| Player Field | Dashboard Usage |
| --- | --- |
| id | Used internally to identify the player record |
| userId | Used internally to connect the player to the authenticated user |
| firstName | Displayed in welcome message |
| lastName | Displayed in profile summary |
| email | Displayed in profile summary |
| role | Displayed as account role |
| status | Displayed as account status |
| createdAt | May be displayed as member since date |
| updatedAt | Not displayed by default |

---

## Required UI Sections

- Welcome section
- Profile summary card
- Character summary section
- Upcoming events section
- Quick actions section

---

## Rules

Non-negotiable constraints.

- The dashboard must only show data for the logged-in player.
- The dashboard must receive player data from the Player Service.
- The dashboard must not query Supabase directly.
- The dashboard must handle missing or incomplete player data safely.
- The dashboard must not expose admin-only actions to standard players.
- The dashboard must use the Player Entity as its source of player data expectations.

---

## Feature Updates

1 - [x] Update the email field to use the EditableField component but do not hook it up to any services.
2 - [x] Update the first name, last name, preferred name, pronouns, and discord fields to use the EditableField component but do not hook it up to any services.

---

## Bug Fixes

---

## Future Considerations

Ideas that may be explored later but are not currently approved.

- Player announcements
- Notifications
- Event registration status
- Character approval status
- Player profile editing
- Membership/payment status
- Recent activity feed
- Game-specific reminders

# Users

## Purpose

Users represent authenticated individuals within the application.

A user may participate in one or more games and may be granted different permissions depending on their role within each game.

---

## Responsibilities

- Authenticate with the application
- Own characters
- Participate in games
- Maintain account information
- Receive permissions through game membership

---

## Does Not Own

- Characters
- Skills
- Items
- Game configuration
- Authentication implementation

---

## Rules

- A user must be authenticated before accessing protected routes
- A user may belong to multiple games
- A user may have different roles in different games
- A user may own multiple characters
- User permissions are determined through game membership
- Users should never directly receive permissions outside of a role

---

## Core Properties

### Identity

- User Id
- Email Address
- Display Name

### Status

- Active
- Inactive
- Suspended

### Metadata

- Created Date
- Last Login Date

---

## Roles

### Player

Can:

- View own characters
- Edit own characters
- View game information

Cannot:

- Modify other users
- Modify game configuration

---

### Staff

Can:

- View all characters
- Edit character records
- Award experience
- Review submissions

Cannot:

- Modify system configuration

---

### Admin

Can:

- Manage users
- Manage roles
- Manage game settings
- Manage skills
- Manage items
- Access administrative tools

---

## Relationships

### User → Game Membership

A user may belong to many games.

### User → Character

A user may own many characters.

### User → Role

A user's role is determined through game membership.
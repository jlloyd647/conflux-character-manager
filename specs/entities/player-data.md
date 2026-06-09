# Player Entity

## Purpose

Represents a player within the system.

A Player is the application-level representation of a user participating in the game. Player records contain profile and administrative information used throughout the application.

---

## Ownership

Owned By:

- Player Service

Referenced By:

- Character Service
- Event Service
- Player Management Page
- Admin Dashboard

---

## Entity Definition

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
  userID: string;
  createdAt: string;
  updatedAt: string;
};
```

---

## Field Definitions

| Field | Description |
| --------- | --------- |
| id | Unique identifier for the player record |
| userId | Reference to the authenticated user account |
| firstName | Player first name |
| lastName | Player last name |
| preferredName | Player preferred name |
| pronouns | Player pronouns |
| email | Player email address |
| role | Application role assigned to the player |
| status | Current player status |
| discordUsername | Player discord username |
| userID | Player userID |
| createdAt | Record creation timestamp |
| updatedAt | Record update timestamp |

---

## Enumerations

### PlayerRole

```ts
type PlayerRole =
  | "player"
  | "staff"
  | "admin";
```

### PlayerStatus

```ts
type PlayerStatus =
  | "active"
  | "inactive"
  | "suspended";
```

---

## Rules

- Every Player must have a unique id.
- Every Player must be associated with a User account.
- Email addresses must be unique.
- Role values must come from the approved PlayerRole list.
- Status values must come from the approved PlayerStatus list.
- Timestamps must be stored in UTC.

---

## Future Considerations

- Preferred name
- Pronouns
- Profile image
- Emergency contact information
- Player notes
- Membership status
- Event attendance tracking
- Character ownership summary

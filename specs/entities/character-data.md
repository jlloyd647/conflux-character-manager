# Character Entity

## Purpose

Represents a character within the system.

A Character is the application-level representation of a user in game representation. Character records contain game and administrative information used throughout the application.

---

## Ownership

Owned By:

- Character Service

Referenced By:

- Character Service
- Event Service
- Character Management Page
- Admin Dashboard

---

## Entity Definition

```ts
type Player = {
  id: string;
  characterID: string;
  characterName: string;
  xp: int;
  playerID: int;
  bloodlineID: int;
  createdAt: string;
};
```

---

## Field Definitions

| Field | Description |
| --------- | --------- |
| id | Unique identifier for the character record |
| characterID | Numeric identifier for the character record |
| characterName | Characters full name |
| xp | Numeric representation of a character resource for skill purchase |
| playerID | Connects a character to a player |
| bloodlineID | Numeric identifier for a characters bloodline |
| createdAt | Record creation timestamp |

---

## Enumerations

---

## Rules

- Every Character must have a unique id.
- Every Character must be associated with a Player account.

---

## Feature Updates

---

## Bug Fixes

1 - [x] Update bloodline to bloodlineID

--


## Future Considerations

- Preferred name
- Pronouns
- Profile image
- Emergency contact information
- Player notes
- Membership status
- Event attendance tracking
- Character ownership summary

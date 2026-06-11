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

## Bridge Tables

Bridge tables exist to show the relationship between two seperate tables when there is a many to many relationship.

character-skill:

character_id: int8
skill_id: int4
approved: boolean
created_at: datetime

character_talent:

character_id: int8
skill_id: int4
approved: boolean
created_at: datetime

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

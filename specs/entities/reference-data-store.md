# Reference Data Store

## Purpose

Exists as a location to store data to be used within the application so that multiple calls for the same data do not need to be made. This will store data that doesn't change very frequently such as skills. There will be multiple stores within this reference data.

## Implementation

Store will use the Zustand library. Stores should be saved within the stores folder in src and should be in a file named referenceDataStore.js.

## Rules

- Stores will be loaded when the application loads
- Stores will be updated when the application makes a change to the database
- Store will include a list of skills
- Store will include a list of bloodlines
- Store will include a list of kingroups
- Store will include a list of banes
- Store will include a list of gifts
- Store will include a list of curses
- Store will include a list of stat progressions

## Feature Updates

1 - [x] We need to add bloodlines to the store as well, they are connected to the bloodlines database.
2 - [x] We need to add kingroups to the store as well, they are connected to the kingroups database.

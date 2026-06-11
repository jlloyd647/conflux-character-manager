# Stats Service

## Explanation of Stats Service

This is the service that creates standard CRUD actions with the character_stats database. There are four skills represented within the character stats, Vitality, Mind, Strength, and Willpower. Each has multiple ranks that a character can be given in exchange for XP. Different ranks offer a different amount of each stat at a different price. They are mapped to a character using the characterID

## Operations Needed

getStatsByID: This will send the database the characterID and retrieve the data that is associated with that character.
addRank: This will send the database a characterID and a rankID and increase that by one.
removeRank: This will send the database a characterID and a rankID and decrease that by one.
clearAllRanks: This will send the database a characterID and set all ranks to 0.

# Skill Service

## Explanation of Skill Service

The skill service will exist as the layer that connects the application to the Supabase hosted skills database. This will use CRUD opperations and allow users based on certain restrictions to create, retrieve, update, and delete skills.

## Operations Needed

getAllSkills: A function to return a list of all skills within the database.
getSkillByID: A function to return the data of a single skill matched by ID.
updateSkillByID: A function to update a single skill matched by ID.
createNewSkill: A function to create a new skill in the database.

## Restrictions

- Users with the role player may getAllSkills or getSkillByID
- Users with the role admin may getAllSkills, getSkillByID, updateSkillByID, or createNewSkill
- No users will be able to delete a row in the database

## Relationships

- Table Component
- Skill Page
- Skill Data Structure

## Future Considerations

- A status will be added to the skill to indicate if it is live, beta, or deleted.

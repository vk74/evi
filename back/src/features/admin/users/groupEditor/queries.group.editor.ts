/**
 * queries.group.editor.ts
 * SQL queries for group management operations.
 * 
 * Contains parameterized queries for:
 * - Checking constraints (uniqueness, existence)
 * - Creating new groups
 * - Adding group details
 */

export const queries = {
  // Check if group name is already taken
  checkGroupName: {
    text: `
      SELECT group_id
      FROM app.groups
      WHERE group_name = $1
      LIMIT 1
    `
  },

  // Check if user exists and get UUID by username
  getUserId: {
    text: `
      SELECT user_id
      FROM app.users
      WHERE username = $1
      LIMIT 1
    `
  },

  // Check if user exists by username
  checkUserExists: {
    text: `
      SELECT user_id
      FROM app.users
      WHERE username = $1
      LIMIT 1
    `
  },

  // Insert new group into app.groups
  insertGroup: {
    text: `
      INSERT INTO app.groups (
        group_id,
        group_name,
        group_status,
        group_owner,
        is_system
      )
      VALUES (
        uuid_generate_v4(),
        $1, $2, $3, $4
      )
      RETURNING group_id
    `
  },
  
  // И меняем insertGroupDetails, используя UUID вместо username
  insertGroupDetails: {
    text: `
      INSERT INTO app.group_details (
        group_id,
        group_description,
        group_email,
        group_created_by,
        group_created_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,  -- UUID создателя группы
        now()
      )
    `
  }
}
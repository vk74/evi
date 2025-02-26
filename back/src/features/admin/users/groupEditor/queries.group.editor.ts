/**
 * queries.group.editor.ts
 * SQL queries for group management operations.
 * 
 * Contains parameterized queries for:
 * - Checking constraints (uniqueness, existence)
 * - Creating new groups
 * - Adding group details
 * - Fetching group data by group ID (separate queries for app.groups and app.group_details)
 * - Updating group data by group ID (separate queries for app.groups and app.group_details)
 */

interface SQLQuery {
  text: string;
}

interface GroupEditorQueries {
  checkGroupName: SQLQuery;
  getUserId: SQLQuery;
  checkUserExists: SQLQuery;
  insertGroup: SQLQuery;
  insertGroupDetails: SQLQuery;
  getGroupById: SQLQuery;
  getGroupDetailsById: SQLQuery;
  updateGroupById: SQLQuery;       // Добавлено
  updateGroupDetailsById: SQLQuery; // Добавлено
}

export const queries: GroupEditorQueries = {
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
  
  // Insert group details into app.group_details
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
  },

  // Fetch group data from app.groups by group_id
  getGroupById: {
    text: `
      SELECT 
        group_id,
        group_name,
        reserve_1,
        group_status,
        group_owner,
        is_system
      FROM app.groups
      WHERE group_id = $1::uuid
      LIMIT 1
    `
  },

  // Fetch group details from app.group_details by group_id
  getGroupDetailsById: {
    text: `
      SELECT 
        group_id,
        group_description,
        group_email,
        group_created_at,
        group_created_by,
        group_modified_at,
        group_modified_by,
        reserve_field_1,
        reserve_field_2,
        reserve_field_3
      FROM app.group_details
      WHERE group_id = $1::uuid
      LIMIT 1
    `
  },

  // Update group data in app.groups by group_id, updating only changed fields
  updateGroupById: {
    text: `
      UPDATE app.groups
      SET
        group_name = COALESCE($2, group_name),
        group_status = COALESCE($3, group_status),
        group_owner = COALESCE($4, group_owner)
      WHERE group_id = $1::uuid
      RETURNING group_id
    `
  },

  // Update group details in app.group_details by group_id
  updateGroupDetailsById: {
    text: `
      UPDATE app.group_details
      SET
        group_description = COALESCE($2, group_description),
        group_email = COALESCE($3, group_email),
        group_modified_at = now(),
        group_modified_by = $4
      WHERE group_id = $1::uuid
      RETURNING group_id
    `
  }
};
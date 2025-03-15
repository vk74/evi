/**
 * queries.item.selector.ts
 * SQL queries for item selector operations (e.g., searching users, adding users to groups, changing group owner).
 * 
 * Contains parameterized queries for:
 * - Searching users by query string (username or UUID) with a limit
 * - Checking if a group exists
 * - Checking if users exist
 * - Checking if users are already members of a group
 * - Adding users to a group
 * - Getting current group owner
 * - Checking if user exists
 * - Updating group owner
 * - Updating group details modified information
 * 
 * Note: Uses parameterized queries to prevent SQL injection attacks.
 */

interface SQLQuery {
  text: string;
}

interface ItemSelectorQueries {
  searchUsers: SQLQuery;
  checkGroupExists: SQLQuery;
  checkUsersExist: SQLQuery;
  checkExistingMembers: SQLQuery;
  addUserToGroup: SQLQuery;
  getCurrentGroupOwner: SQLQuery;     // New query for getting current group owner
  checkUserExists: SQLQuery;          // New query for checking if user exists
  updateGroupOwner: SQLQuery;         // New query for updating group owner
  updateGroupDetails: SQLQuery;       // New query for updating group details
}

export const queries: ItemSelectorQueries = {
  // Search users by query string (username, UUID or email) with a limit on the number of results
  searchUsers: {
    text: `
      SELECT 
        user_id AS uuid,
        username AS name,
        username,
        user_id AS uuid  -- Explicitly including uuid for consistency
      FROM app.users
      WHERE username ILIKE $1  -- Case-insensitive search by username
         OR user_id::text ILIKE $1  -- Case-insensitive search by UUID
         OR email ILIKE $1  -- Case-insensitive search by email
      ORDER BY username
      LIMIT $2
    `
  },

  // Check if a group exists by its UUID
  checkGroupExists: {
    text: `
      SELECT group_id
      FROM app.groups
      WHERE group_id = $1
    `
  },

  // Check which users exist from a list of UUIDs
  checkUsersExist: {
    text: `
      SELECT user_id
      FROM app.users
      WHERE user_id = ANY($1)
    `
  },

  // Check which users are already members of a specific group
  checkExistingMembers: {
    text: `
      SELECT user_id
      FROM app.group_members
      WHERE group_id = $1
        AND user_id = ANY($2)
        AND is_active = true
    `
  },

  // Add a user to a group
  addUserToGroup: {
    text: `
      INSERT INTO app.group_members (
        group_id,
        user_id,
        added_by,
        joined_at,
        is_active
      )
      VALUES (
        $1,
        $2,
        $3,
        CURRENT_TIMESTAMP,
        true
      )
      RETURNING member_id
    `
  },

  // Get current owner of a group by group ID
  getCurrentGroupOwner: {
    text: `
      SELECT group_owner
      FROM app.groups
      WHERE group_id = $1
    `
  },

  // Check if user exists by UUID
  checkUserExists: {
    text: `
      SELECT user_id
      FROM app.users
      WHERE user_id = $1
    `
  },

  // Update group owner in the groups table
  updateGroupOwner: {
    text: `
      UPDATE app.groups
      SET group_owner = $2
      WHERE group_id = $1
      RETURNING group_id
    `
  },

  // Update modified information in group_details table
  updateGroupDetails: {
    text: `
      UPDATE app.group_details
      SET group_modified_at = CURRENT_TIMESTAMP,
          group_modified_by = $2
      WHERE group_id = $1
      RETURNING group_id
    `
  }
};
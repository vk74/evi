/**
 * queries.item.selector.ts
 * SQL queries for item selector operations (e.g., searching users).
 * 
 * Contains parameterized queries for:
 * - Searching users by query string with a limit
 * 
 * Note: Uses parameterized queries to prevent SQL injection attacks.
 */

interface SQLQuery {
  text: string;
}

interface ItemSelectorQueries {
  searchUsers: SQLQuery;
}

export const queries: ItemSelectorQueries = {
  // Search users by query string with a limit on the number of results
  searchUsers: {
    text: `
      SELECT 
        user_id AS uuid,
        username AS name,
        username,
        user_id AS uuid  -- Explicitly including uuid for consistency
      FROM app.users
      WHERE username ILIKE $1  -- Case-insensitive search by username
      ORDER BY username
      LIMIT $2
    `
  },
};
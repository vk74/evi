/**
 * queries.users.list.ts - backend file
 * version: 1.0.0
 * 
 * SQL queries for fetching and managing users data.
 * Contains prepared queries to interact with app.users table.
 * Includes queries for retrieving users list and deleting users by ID.
 */
import type { SQLQueries } from './types.users.list';

/**
 * SQL queries for users operations
 */
export const queries: SQLQueries = {
  getAllUsers: `
    SELECT 
      user_id,
      username,
      email,
      is_staff,
      account_status,
      first_name,
      middle_name,
      last_name,
      created_at
    FROM app.users
    ORDER BY username ASC
  `,

  deleteSelectedUsers: `
    DELETE FROM app.users
    WHERE user_id = ANY($1::uuid[])
    RETURNING user_id;
  `,
};

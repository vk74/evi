/**
 * @file protoQueries.users.list.ts
 * Version: 1.0.0
 * SQL queries for the prototype users list management module with server-side processing.
 * 
 * Functionality:
 * - Provides parametrized queries for fetching users with filtering and sorting
 * - Contains query for user deletion
 * - Supports pagination and search functionality
 */

import { SortableColumn } from './types.users.list';

// Column mapping for sorting
const SORT_COLUMNS: Record<string, SortableColumn> = {
  'user_id': 'user_id',
  'username': 'username',
  'email': 'email',
  'first_name': 'first_name',
  'last_name': 'last_name',
  'is_staff': 'is_staff',
  'account_status': 'account_status',
  'created_at': 'created_at'
};

// Default sort column if none specified
const DEFAULT_SORT_COLUMN: SortableColumn = 'created_at';

/**
 * Builds ORDER BY clause based on sorting parameters
 */
export function buildSortClause(sortBy?: string, sortDesc?: boolean): string {
  const column = sortBy && SORT_COLUMNS[sortBy] ? SORT_COLUMNS[sortBy] : DEFAULT_SORT_COLUMN;
  const direction = sortDesc ? 'DESC' : 'ASC';
  
  return `${column} ${direction}`;
}

/**
 * Query to fetch users with filtering, sorting and pagination
 */
export const fetchUsersQuery = `
  WITH filtered_users AS (
    SELECT 
      user_id, username, email, is_staff, account_status,
      first_name, middle_name, last_name, created_at
    FROM app.users
    WHERE 
      ($1 = '' OR 
       username ILIKE '%' || $1 || '%' OR 
       email ILIKE '%' || $1 || '%' OR 
       user_id::text ILIKE '%' || $1 || '%' OR
       first_name ILIKE '%' || $1 || '%' OR 
       last_name ILIKE '%' || $1 || '%' OR
       middle_name ILIKE '%' || $1 || '%')
  ),
  counted AS (
    SELECT COUNT(*) AS total FROM filtered_users
  )
  SELECT u.*, c.total
  FROM filtered_users u, counted c
  ORDER BY $2
  LIMIT $3 OFFSET $4
`;

/**
 * Query to delete multiple users by ID
 */
export const deleteSelectedUsersQuery = `
  DELETE FROM app.users 
  WHERE user_id = ANY($1::uuid[])
  RETURNING user_id
`;

/**
 * Query to fetch usernames and is_system flags by IDs
 */
export const fetchUsersByIdsForDeletionQuery = `
  SELECT user_id, username, is_system
  FROM app.users
  WHERE user_id = ANY($1::uuid[])
`;

/**
 * SQL queries object
 */
export const queries = {
  fetchUsers: fetchUsersQuery,
  deleteSelectedUsers: deleteSelectedUsersQuery,
  fetchUsersByIdsForDeletion: fetchUsersByIdsForDeletionQuery
};

export default queries;

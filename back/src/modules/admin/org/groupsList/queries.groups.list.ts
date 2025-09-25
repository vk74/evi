/**
 * @file queries.groups.list.ts
 * SQL queries for fetching and managing groups data.
 */
import type { SQLQueries } from './types.groups.list';

/**
 * SQL queries for groups operations
 */
export const queries: SQLQueries = {
  getAllGroups: `
    SELECT 
      g.group_id,
      g.group_name,
      g.group_status,
      g.is_system,
      u.username AS owner_username
    FROM app.groups g
    LEFT JOIN app.users u ON u.user_id = g.group_owner
    ORDER BY g.group_name DESC
  `,

  deleteSelectedGroups: `
    DELETE FROM app.groups
    WHERE group_id = ANY($1::uuid[])
    RETURNING group_id;
  `,
};
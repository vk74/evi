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
      group_id,
      group_name,
      group_status,
      group_owner,
      is_system
    FROM app.groups
    ORDER BY group_name DESC
  `,

  deleteSelectedGroups: `
    DELETE FROM app.groups
    WHERE group_id = ANY($1::uuid[])
    RETURNING group_id;
  `,
};
/**
 * @file queries.groups.list.ts
 * SQL queries for fetching and managing groups data.
 */

interface SQLQueries {
  getAllGroups: string;
}

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
  `
};
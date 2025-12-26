/**
 * queries.user.location.selection.ts - version 1.1.0
 * SQL queries for user location selection operations.
 * 
 * Contains queries for fetching regions list and updating user location.
 * File: queries.user.location.selection.ts (backend)
 * 
 * Changes in v1.1.0:
 * - Updated getUserLocation to use location_id with JOIN to regions table
 * - Updated updateUserLocation to accept region_name and convert to region_id
 */

export const userLocationSelectionQueries = {
  /**
   * Fetch all region names from app.regions table
   * Returns region names ordered alphabetically
   * No parameters
   */
  fetchAllRegions: `
    SELECT region_name
    FROM app.regions
    ORDER BY region_name ASC
  `,

  /**
   * Check if region exists by name and return region_id
   * Parameters: [region_name]
   */
  checkRegionExists: `
    SELECT region_id, region_name
    FROM app.regions
    WHERE region_name = $1
  `,

  /**
   * Get user location by username
   * Returns region_name from regions table via JOIN
   * Parameters: [username]
   */
  getUserLocation: `
    SELECT r.region_name as location
    FROM app.users u
    LEFT JOIN app.regions r ON u.location_id = r.region_id
    WHERE u.username = $1
  `,

  /**
   * Update user location by username
   * Accepts region_name, converts to region_id via subquery
   * Parameters: [region_name, username]
   */
  updateUserLocation: `
    UPDATE app.users
    SET location_id = (
      SELECT region_id 
      FROM app.regions 
      WHERE region_name = $1
    )
    WHERE username = $2
    RETURNING user_id, 
              username,
              (SELECT region_name FROM app.regions WHERE region_id = app.users.location_id) as location
  `
};


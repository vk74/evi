/**
 * queries.user.location.selection.ts - version 1.0.0
 * SQL queries for user location selection operations.
 * 
 * Contains queries for fetching regions list and updating user location.
 * File: queries.user.location.selection.ts (backend)
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
   * Check if region exists by name
   * Parameters: [region_name]
   */
  checkRegionExists: `
    SELECT region_name
    FROM app.regions
    WHERE region_name = $1
  `,

  /**
   * Get user location by username
   * Parameters: [username]
   */
  getUserLocation: `
    SELECT location
    FROM app.users
    WHERE username = $1
  `,

  /**
   * Update user location by username
   * Parameters: [location, username]
   */
  updateUserLocation: `
    UPDATE app.users
    SET location = $1
    WHERE username = $2
    RETURNING user_id, 
              username,
              location
  `
};


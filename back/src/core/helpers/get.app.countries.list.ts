/**
 * version: 1.1.0
 * Helper for retrieving list of countries from app.app_countries ENUM.
 * Backend file that queries database to get available country values.
 * Filename: get.app.countries.list.ts (backend)
 * 
 * Changes in v1.1.0:
 * - Moved SQL query to queries.helpers.ts for reusability
 * - Updated to use queries.fetchAppCountries from queries.helpers.ts
 */

import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.helpers';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Get list of available countries from app.app_countries ENUM
 * @returns Promise with array of country codes (e.g., ['russia', 'kazakhstan'])
 */
export async function getAppCountriesList(): Promise<string[]> {
  try {
    const result = await pool.query<{ enumlabel: string }>(queries.fetchAppCountries);

    return result.rows.map(row => row.enumlabel);
  } catch (error) {
    console.error('Error fetching app countries list:', error);
    throw new Error('Failed to fetch countries list from database');
  }
}


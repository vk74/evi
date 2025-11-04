/**
 * version: 1.0.0
 * Helper for retrieving list of active price list IDs from app.price_lists_info table.
 * Backend file that queries database to get active price list ID values.
 * Filename: get.active.pricelist.ids.ts (backend)
 */

import { Pool } from 'pg';
import { pool as pgPool } from '@/core/db/maindb';
import { queries } from './queries.helpers';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Get list of active price list IDs from app.price_lists_info
 * @returns Promise with array of price list IDs (e.g., [8, 10, 12])
 */
export async function getActivePriceListIds(): Promise<number[]> {
  try {
    const result = await pool.query<{ price_list_id: number }>(queries.fetchActivePriceListIds);

    return result.rows.map(row => row.price_list_id);
  } catch (error) {
    console.error('Error fetching active price list IDs:', error);
    throw new Error('Failed to fetch active price list IDs from database');
  }
}


/**
 * check.group.exists.ts - version 1.0.0
 * Helper function to check if a group exists in the database.
 * 
 * Functionality:
 * - Checks if a UUID exists in the app.groups table
 * - Returns boolean indicating group existence
 * - Handles database errors gracefully
 * - Used for validation in various services
 * 
 * @param uuid - UUID to check for existence
 * @returns Promise<boolean> - true if group exists, false otherwise
 */

import { Pool } from 'pg';
import { pool as pgPool } from '../db/maindb';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Checks if a group exists in the database by UUID
 * @param uuid - UUID of the group to check
 * @returns Promise<boolean> indicating if group exists
 */
export async function checkGroupExists(uuid: string): Promise<boolean> {
    try {
        const query = `
            SELECT id 
            FROM app.groups 
            WHERE id = $1
        `;
        
        const result = await pool.query(query, [uuid]);
        return result.rows.length > 0;
        
    } catch (error) {
        console.error('[checkGroupExists] Error checking group existence:', error);
        return false;
    }
}

export default checkGroupExists; 
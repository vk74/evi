/**
 * check.user.exists.ts - version 1.0.0
 * Helper function to check if a user exists in the database.
 * 
 * Functionality:
 * - Checks if a UUID exists in the app.users table
 * - Returns boolean indicating user existence
 * - Handles database errors gracefully
 * - Used for validation in various services
 * 
 * @param uuid - UUID to check for existence
 * @returns Promise<boolean> - true if user exists, false otherwise
 */

import { Pool } from 'pg';
import { pool as pgPool } from '../db/maindb';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Checks if a user exists in the database by UUID
 * @param uuid - UUID of the user to check
 * @returns Promise<boolean> indicating if user exists
 */
export async function checkUserExists(uuid: string): Promise<boolean> {
    try {
        const query = `
            SELECT id 
            FROM app.users 
            WHERE id = $1
        `;
        
        const result = await pool.query(query, [uuid]);
        return result.rows.length > 0;
        
    } catch (error) {
        console.error('[checkUserExists] Error checking user existence:', error);
        return false;
    }
}

export default checkUserExists; 
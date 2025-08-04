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
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { USER_EXISTS_EVENTS } from './events.helpers';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Checks if a user exists in the database by UUID
 * @param uuid - UUID of the user to check
 * @returns Promise<boolean> indicating if user exists
 */
export async function checkUserExists(uuid: string): Promise<boolean> {
    try {
        // Log start of user existence check
        await createAndPublishEvent({
            eventName: USER_EXISTS_EVENTS.START.eventName,
            payload: { uuid }
        });

        const query = `
            SELECT id 
            FROM app.users 
            WHERE id = $1
        `;
        
        const result = await pool.query(query, [uuid]);
        const exists = result.rows.length > 0;
        
        // Log result of user existence check
        if (exists) {
            await createAndPublishEvent({
                eventName: USER_EXISTS_EVENTS.FOUND.eventName,
                payload: { uuid, exists: true }
            });
        } else {
            await createAndPublishEvent({
                eventName: USER_EXISTS_EVENTS.NOT_FOUND.eventName,
                payload: { uuid, exists: false }
            });
        }
        
        return exists;
        
    } catch (error) {
        // Log error during user existence check
        await createAndPublishEvent({
            eventName: USER_EXISTS_EVENTS.ERROR.eventName,
            payload: { uuid, error: error instanceof Error ? error.message : String(error) },
            errorData: error instanceof Error ? error.message : String(error)
        });
        return false;
    }
}

export default checkUserExists; 
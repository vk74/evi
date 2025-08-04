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
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { GROUP_EXISTS_EVENTS } from './events.helpers';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Checks if a group exists in the database by UUID
 * @param uuid - UUID of the group to check
 * @returns Promise<boolean> indicating if group exists
 */
export async function checkGroupExists(uuid: string): Promise<boolean> {
    try {
        // Log start of group existence check
        await createAndPublishEvent({
            eventName: GROUP_EXISTS_EVENTS.START.eventName,
            payload: { uuid }
        });

        const query = `
            SELECT id 
            FROM app.groups 
            WHERE id = $1
        `;
        
        const result = await pool.query(query, [uuid]);
        const exists = result.rows.length > 0;
        
        // Log result of group existence check
        if (exists) {
            await createAndPublishEvent({
                eventName: GROUP_EXISTS_EVENTS.FOUND.eventName,
                payload: { uuid, exists: true }
            });
        } else {
            await createAndPublishEvent({
                eventName: GROUP_EXISTS_EVENTS.NOT_FOUND.eventName,
                payload: { uuid, exists: false }
            });
        }
        
        return exists;
        
    } catch (error) {
        // Log error during group existence check
        await createAndPublishEvent({
            eventName: GROUP_EXISTS_EVENTS.ERROR.eventName,
            payload: { uuid, error: error instanceof Error ? error.message : String(error) },
            errorData: error instanceof Error ? error.message : String(error)
        });
        return false;
    }
}

export default checkGroupExists; 
/**
 * service.load.user.ts - version 1.0.01
 * Service for loading user data operations.
 * 
 * Functionality:
 * - Retrieves user data from database
 * - Combines user account and profile data
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * - Now accepts req object for access to user context
 * 
 * Data flow:
 * 1. Receive user ID and request object
 * 2. Query database for user account data
 * 3. Query database for user profile data
 * 4. Combine and return formatted response
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { queries } from './queries.user.editor';
import type { DbUser, DbUserProfile, LoadUserResponse } from './types.user.editor';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';

// Type assertion for pool
const pool = pgPool as Pool;

// Logging helper
function logService(message: string, meta?: object): void {
    console.log(`[${new Date().toISOString()}] [LoadUserService] ${message}`, meta || '');
}

/**
 * Loads user data by ID from database
 * @param userId - UUID of the user to load
 * @param req - Express request object for accessing user context
 * @returns Promise with user data in frontend-compatible format
 * @throws Error if user not found or database error occurs
 */
export async function loadUserById(userId: string, req: Request): Promise<LoadUserResponse> {
    try {
        // Get the UUID of the user making the request
        const requestorUuid = getRequestorUuidFromReq(req);
        logService('Loading user data from database', { userId, requestorUuid });

        // Get user account data
        const userResult = await pool.query<DbUser>(queries.getUserById, [userId]);
        
        if (userResult.rows.length === 0) {
            throw {
                code: 'NOT_FOUND',
                message: 'User not found'
            };
        }

        // Get user profile data
        const profileResult = await pool.query<DbUserProfile>(
            queries.getUserProfileById, 
            [userId]
        );

        if (profileResult.rows.length === 0) {
            throw {
                code: 'NOT_FOUND',
                message: 'User profile not found'
            };
        }

        // Combine data into response format
        const response: LoadUserResponse = {
            success: true,
            message: 'User data loaded successfully',
            data: {
                user: userResult.rows[0],
                profile: profileResult.rows[0]
            }
        };

        logService('Successfully retrieved user data', { userId, requestorUuid });
        return response;

    } catch (error) {
        logService('Error in service while loading user data', { userId, error });
        throw error; // Pass error to controller for handling
    }
}

export default loadUserById;
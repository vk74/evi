/**
 * service.load.user.ts - version 1.0.02
 * Service for loading user data operations.
 * 
 * Functionality:
 * - Retrieves user data from database
 * - Combines user account and profile data
 * - Handles data transformation and business logic
 * - Manages database interactions and error handling
 * - Now uses event bus for operation tracking and logging
 * 
 * Data flow:
 * 1. Receive user ID and request object
 * 2. Query database for user account data
 * 3. Query database for user profile data
 * 4. Combine and return formatted response
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './queries.user.editor';
import type { DbUser, DbUserProfile, LoadUserResponse, ServiceError } from './types.user.editor';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USER_LOAD_EVENTS } from './events.user.editor';

// Type assertion for pool
const pool = pgPool as Pool;

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
        
        // Create and publish request received event
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USER_LOAD_EVENTS.REQUEST_RECEIVED.eventName,
            payload: {
                userId,
                requestorUuid
            }
        });

        // Get user account data
        const userResult = await pool.query<DbUser>(queries.getUserById, [userId]);
        
        if (userResult.rows.length === 0) {
            // Create and publish user not found event
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: USER_LOAD_EVENTS.NOT_FOUND.eventName,
                payload: {
                    userId,
                    requestorUuid
                }
            });
            
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
            // Create and publish profile not found event
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: USER_LOAD_EVENTS.NOT_FOUND.eventName,
                payload: {
                    userId,
                    requestorUuid,
                    detail: 'User profile not found'
                }
            });
            
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

        // Create and publish successful load event
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USER_LOAD_EVENTS.COMPLETE.eventName,
            payload: {
                userId,
                username: userResult.rows[0].username,
                requestorUuid
            }
        });
        
        return response;

    } catch (error) {
        // If this is not a NOT_FOUND error, publish a FAILED event
        if ((error as ServiceError).code !== 'NOT_FOUND') {
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: USER_LOAD_EVENTS.FAILED.eventName,
                payload: {
                    userId,
                    error: (error as ServiceError).code ? error : {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: error instanceof Error ? error.message : String(error)
                    }
                },
                errorData: error instanceof Error ? error.message : String(error)
            });
        }
        
        throw error; // Pass error to controller for handling
    }
}

export default loadUserById;
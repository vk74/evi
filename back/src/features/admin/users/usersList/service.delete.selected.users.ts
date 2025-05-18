/**
 * service.delete.selected.users.ts - backend file
 * version: 1.0.01
 * 
 * Service for deleting selected users.
 * 
 * This service provides business logic for deleting multiple users:
 * - Validates input data
 * - Executes deletion in database
 * - Invalidates cache after successful deletion
 * - Handles errors and generates appropriate events
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { queries } from './queries.users.list';
import usersRepository from './repository.users.list';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import { DeleteUsersPayload, UserError } from './types.users.list';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USERS_DELETE_EVENTS } from './events.users.list';

/**
 * Service function to delete multiple users by IDs
 * 
 * @param req - Express Request object containing user context
 * @param payload - Object containing array of user IDs to delete
 * @returns Promise resolving to object with deleted user IDs
 */
export async function deleteSelectedUsers(
    req: Request,
    payload: DeleteUsersPayload
): Promise<{ deletedUserIds: string[] }> {
    try {
        // Get requestor UUID
        const requestorUuid = getRequestorUuidFromReq(req) || 'unknown';
        
        // Publish event for incoming delete request
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USERS_DELETE_EVENTS.REQUEST_RECEIVED.eventName,
            payload: {
                userIds: payload.userIds,
                requestorUuid
            }
        });

        // Validate input
        if (!payload.userIds || !Array.isArray(payload.userIds) || payload.userIds.length === 0) {
            const validationError: UserError = {
                code: 'VALIDATION_ERROR',
                message: 'No user IDs provided for deletion'
            };

            // Publish validation error event
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: USERS_DELETE_EVENTS.VALIDATION_FAILED.eventName,
                payload: validationError
            });

            throw validationError;
        }

        // Execute delete query with array of UUIDs as parameter
        const dbResult = await pgPool.query(
            queries.deleteSelectedUsers,
            [payload.userIds]
        );

        // Get deleted user IDs from query result
        const deletedUserIds = dbResult.rows.map((row: any) => row.user_id);

        // Invalidate cache to force fresh data load on next request
        usersRepository.invalidateCache();

        // Publish cache invalidation event
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USERS_DELETE_EVENTS.CACHE_INVALIDATE.eventName,
            payload: null
        });

        // Publish success event
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
            payload: {
                deletedCount: deletedUserIds.length,
                requestorUuid: getRequestorUuidFromReq(req) || 'unknown'
            }
        });

        // Return deleted IDs
        return { deletedUserIds };

    } catch (error: any) {
        // Create standardized error object
        const userError: UserError = {
            code: error.code || 'USERS_DELETE_ERROR',
            message: error.message || 'Failed to delete users',
            details: error
        };

        // Publish failure event
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: USERS_DELETE_EVENTS.FAILED.eventName,
            payload: {
                error: userError
            },
            errorData: JSON.stringify(userError)
        });

        // Re-throw error for controller to handle
        throw userError;
    }
}

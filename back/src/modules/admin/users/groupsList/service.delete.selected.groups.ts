/**
 * @file service.delete.selected.groups.ts - version 1.0.02
 * Backend service for deleting selected groups.
 *
 * Functionality:
 * - Deletes selected groups from the database.
 * - Clears the cache after successful deletion.
 * - Uses event bus for tracking operations and error handling.
 * - Accepts request object for access to user context.
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './queries.groups.list';
import { groupsRepository } from './repository.groups.list';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUPS_DELETE_EVENTS } from './events.groups.list';

// Explicitly set type for pool
const pool = pgPool as Pool;

/**
 * Backend service for deleting selected groups
 */
export const deleteSelectedGroupsService = {
    /**
     * Deletes selected groups by their IDs
     * @param groupIds - Array of group UUIDs to delete
     * @param req - Express request object for context
     * @returns Promise<number> - Number of deleted groups
     * @throws {Error} - If an error occurs
     */
    async deleteSelectedGroups(groupIds: string[], req: Request): Promise<number> {
        try {
            // Get UUID of the user making the request
            const requestorUuid = getRequestorUuidFromReq(req);
            
            // Create event for deletion operation start
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: GROUPS_DELETE_EVENTS.COMPLETE.eventName,
                payload: {
                    groupIds,
                    requestorUuid
                }
            });

            // Execute SQL query to delete groups
            const result = await pool.query(queries.deleteSelectedGroups, [groupIds]);

            // Check result
            if (!result.rows || !Array.isArray(result.rows)) {
                const errorMessage = 'Invalid database response format';
                
                // Create event for error
                await fabricEvents.createAndPublishEvent({
                    req,
                    eventName: GROUPS_DELETE_EVENTS.FAILED.eventName,
                    payload: {
                        error: errorMessage
                    },
                    errorData: errorMessage
                });
                
                throw new Error(errorMessage);
            }

            // Get number of deleted groups
            const deletedCount = result.rows.length;
            
            // Create event for successful deletion
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: GROUPS_DELETE_EVENTS.COMPLETE.eventName,
                payload: {
                    deletedCount,
                    requestorUuid
                }
            });

            // Clear cache in repository
            groupsRepository.clearCache();

            // Check if cache is actually cleared
            const isCacheCleared = !groupsRepository.hasValidCache();
            if (isCacheCleared) {
                // Create event for successful cache clearing
                await fabricEvents.createAndPublishEvent({
                    req,
                    eventName: GROUPS_DELETE_EVENTS.CACHE_INVALIDATED.eventName,
                    payload: { requestorUuid }
                });
            } else {
                // Create event for failed cache clearing
                await fabricEvents.createAndPublishEvent({
                    req,
                    eventName: GROUPS_DELETE_EVENTS.CACHE_INVALIDATION_FAILED.eventName,
                    payload: { requestorUuid }
                });
            }

            // Return number of deleted groups
            return deletedCount;

        } catch (error) {
            // Create event for deletion error
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: GROUPS_DELETE_EVENTS.FAILED.eventName,
                payload: {
                    error: 'Error during groups deletion'
                },
                errorData: error instanceof Error ? error.message : String(error)
            });

            // Re-throw error
            throw new Error(
                process.env.NODE_ENV === 'development' ?
                    (error instanceof Error ? error.message : String(error)) :
                    'Failed to delete selected groups'
            );
        }
    }
};

export default deleteSelectedGroupsService;
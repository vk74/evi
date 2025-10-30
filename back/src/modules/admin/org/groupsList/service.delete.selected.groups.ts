/**
 * @file service.delete.selected.groups.ts - version 1.0.03
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
     * @returns Promise<{ success: boolean; message: string; deleted: { ids: string[]; names: string[]; count: number }; forbidden?: { ids: string[]; names: string[]; count: number } }>
     * @throws {Error} - If an error occurs
     */
    async deleteSelectedGroups(groupIds: string[], req: Request): Promise<{ success: boolean; message: string; deleted: { ids: string[]; names: string[]; count: number }; forbidden?: { ids: string[]; names: string[]; count: number } }> {
        try {
            // Basic validation / noop
            if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
                await fabricEvents.createAndPublishEvent({
                    req,
                    eventName: GROUPS_DELETE_EVENTS.NOOP.eventName,
                    payload: { reason: 'NOTHING_TO_DELETE', groupIds: [] }
                });
                return { success: false, message: 'Nothing to delete', deleted: { ids: [], names: [], count: 0 } };
            }

            // Precheck: load groups by ids to detect system groups and collect names
            const precheckResult = await pool.query(queries.getGroupsByIds, [groupIds]);
            const precheckRows: Array<{ id: string; name: string; is_system: boolean }> = precheckResult.rows || [];

            const blocked = precheckRows.filter(r => r.is_system === true);
            if (blocked.length > 0) {
                await fabricEvents.createAndPublishEvent({
                    req,
                    eventName: GROUPS_DELETE_EVENTS.FORBIDDEN.eventName,
                    payload: {
                        blockedGroupIds: blocked.map(b => b.id),
                        blockedGroupNames: blocked.map(b => b.name),
                        reason: 'SYSTEM_GROUPS_NOT_DELETABLE'
                    }
                });
                // Entire operation is blocked (policy b)
                return {
                    success: false,
                    message: 'Deletion is forbidden for system groups',
                    deleted: { ids: [], names: [], count: 0 },
                    forbidden: {
                        ids: blocked.map(b => b.id),
                        names: blocked.map(b => b.name),
                        count: blocked.length
                    }
                };
            }

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

            // Get number of deleted groups and ids
            const deletedIds: string[] = (result.rows || []).map(r => r.group_id);
            const deletedCount = deletedIds.length;

            // Try to resolve names from precheck (same set, as no system groups)
            const nameMap = new Map(precheckRows.map(r => [r.id, r.name] as const));
            const deletedNames = deletedIds.map(id => nameMap.get(id)).filter(Boolean) as string[];

            // Create event for successful deletion
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: GROUPS_DELETE_EVENTS.COMPLETE.eventName,
                payload: {
                    deletedCount,
                    deletedGroupIds: deletedIds,
                    deletedGroupNames: deletedNames
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
                    payload: {}
                });
            } else {
                // Create event for failed cache clearing
                await fabricEvents.createAndPublishEvent({
                    req,
                    eventName: GROUPS_DELETE_EVENTS.CACHE_INVALIDATION_FAILED.eventName,
                    payload: {}
                });
            }

            // Return structured result
            return {
                success: true,
                message: `Successfully deleted ${deletedCount} group${deletedCount === 1 ? '' : 's'}`,
                deleted: { ids: deletedIds, names: deletedNames, count: deletedCount }
            };

        } catch (error) {
            // Create event for deletion error
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: GROUPS_DELETE_EVENTS.FAILED.eventName,
                payload: {
                    error: 'Error during groups deletion',
                    groupIds
                },
                errorData: error instanceof Error ? error.message : String(error)
            });

            // Re-throw error with consistent message
            throw new Error('Failed to delete selected groups');
        }
    }
};

export default deleteSelectedGroupsService;
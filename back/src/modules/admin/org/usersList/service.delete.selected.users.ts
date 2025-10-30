/**
 * @file protoService.delete.users.ts
 * Version: 1.1.0
 * BACKEND service for prototype user deletion operations with server-side processing.
 * 
 * Functionality:
 * - Prevents deletion of system accounts (is_system=true) and reports attempted usernames
 * - Handles deletion of users by UUID
 * - Supports batch deletion with transaction
 * - Invalidates cache after operations
 * - Uses event bus for tracking operations
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './queries.users.list';
import { usersCache } from './cache.users.list';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USERS_DELETE_EVENTS } from './events.users.list';

// Cast pool to correct type
const pool = pgPool as Pool;

/**
 * Service for handling user deletion operations
 */
export const usersDeleteService = {
  /**
   * Deletes selected users by their UUIDs
   * @param userIds Array of user UUIDs to delete
   * @param req Express request object for context
   * @returns Structured response compatible with frontend
   */
  async deleteSelectedUsers(
    userIds: string[],
    req: Request
  ): Promise<{
    success: boolean;
    message: string;
    deleted: { ids: string[]; names: string[]; count: number };
    forbidden?: { ids: string[]; names: string[]; count: number };
  }> {
    try {
      // NOOP on empty input
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: USERS_DELETE_EVENTS.NOOP.eventName,
          payload: { reason: 'NOTHING_TO_DELETE', userIds: [] }
        });
        return { success: false, message: 'Nothing to delete', deleted: { ids: [], names: [], count: 0 } };
      }

      // Precheck: load users to detect system ones and collect usernames
      const precheck = await pool.query(queries.fetchUsersByIdsForDeletion, [userIds]);
      const rows: Array<{ user_id: string; username: string; is_system: boolean }> = precheck.rows || [];

      const blocked = rows.filter(r => r.is_system === true);
      if (blocked.length > 0) {
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: USERS_DELETE_EVENTS.FORBIDDEN.eventName,
          payload: {
            blockedUserIds: blocked.map(b => b.user_id),
            blockedUsernames: blocked.map(b => b.username),
            reason: 'SYSTEM_USERS_NOT_DELETABLE'
          }
        });
        // Entire operation is blocked (policy b)
        return {
          success: false,
          message: 'Deletion is forbidden for system users',
          deleted: { ids: [], names: [], count: 0 },
          forbidden: {
            ids: blocked.map(b => b.user_id),
            names: blocked.map(b => b.username),
            count: blocked.length
          }
        };
      }

      // Execute deletion
      const result = await pool.query(queries.deleteSelectedUsers, [userIds]);

      // Collect deleted ids and names
      const deletedIds: string[] = (result.rows || []).map(r => r.user_id);
      const nameMap = new Map(rows.map(r => [r.user_id, r.username] as const));
      const deletedNames: string[] = deletedIds.map(id => nameMap.get(id)).filter(Boolean) as string[];
      const deletedCount = deletedIds.length;

      // Emit completion event
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
        payload: {
          deletedCount,
          deletedUserIds: deletedIds,
          deletedUsernames: deletedNames
        }
      });

      // Invalidate cache
      usersCache.invalidate('delete');

      // Emit cache events
      const cacheInvalidated = true; // usersCache has no validity check API; assume success
      if (cacheInvalidated) {
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: USERS_DELETE_EVENTS.CACHE_INVALIDATED.eventName,
          payload: {}
        });
      } else {
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: USERS_DELETE_EVENTS.CACHE_INVALIDATION_FAILED.eventName,
          payload: {}
        });
      }

      return {
        success: true,
        message: `Successfully deleted ${deletedCount} user${deletedCount === 1 ? '' : 's'}`,
        deleted: { ids: deletedIds, names: deletedNames, count: deletedCount }
      };
    } catch (error) {
      // Emit failure event
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USERS_DELETE_EVENTS.FAILED.eventName,
        payload: {
          error: 'Error during users deletion',
          userIds
        },
        errorData: error instanceof Error ? error.message : String(error)
      });

      throw new Error('Failed to delete selected users');
    }
  }
};

export default usersDeleteService;

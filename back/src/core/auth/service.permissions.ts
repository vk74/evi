/**
 * @file service.permissions.ts
 * Version: 1.1.0
 * Service for loading and caching system permissions.
 * Implements Singleton pattern using module-level state.
 * 
 * Changes in v1.1.0:
 * - Refactored to functional style (removed class)
 * - Removed redundant event logging
 */

import { Pool } from 'pg';
import { pool as pgPool } from '../db/maindb';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { PERMISSION_SERVICE_EVENTS } from './events.authorization';
import { PermissionMap, PermissionRecord } from './types.authorization';

// Type assertion for pool
const pool = pgPool as Pool;

// Module-level state
const permissionsMap: PermissionMap = new Map();
let isLoaded: boolean = false;

/**
 * Load system permissions from database into memory.
 * Should be called at server startup.
 */
export async function loadPermissions(): Promise<void> {
  try {
    const query = `
      SELECT gp.group_id, gp.permission_key 
      FROM app.group_permissions gp 
      JOIN app.groups g ON gp.group_id = g.group_id 
      WHERE g.is_system = true
    `;

    const result = await pool.query<PermissionRecord>(query);
    
    // Clear existing map before repopulating (in case of reload)
    permissionsMap.clear();

    let permissionsCount = 0;

    for (const row of result.rows) {
      if (!permissionsMap.has(row.group_id)) {
        permissionsMap.set(row.group_id, new Set());
      }
      permissionsMap.get(row.group_id)?.add(row.permission_key);
      permissionsCount++;
    }

    isLoaded = true;
    
    console.log(`[PermissionService] Loaded ${permissionsCount} permissions for ${permissionsMap.size} system groups.`);

  } catch (error) {
    await createAndPublishEvent({
      eventName: PERMISSION_SERVICE_EVENTS.LOAD_ERROR.eventName,
      payload: { 
        error: error instanceof Error ? error.message : String(error),
        attemptedAt: new Date().toISOString()
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Get combined permissions for a list of groups.
 * @param groupIds Array of group UUIDs
 * @returns Set of unique permission keys
 */
export function getPermissionsForGroups(groupIds: string[]): Set<string> {
  const combinedPermissions = new Set<string>();
  
  if (!isLoaded) {
    console.warn('[PermissionService] Warning: Permissions not loaded when requested!');
  }

  for (const groupId of groupIds) {
    const groupPermissions = permissionsMap.get(groupId);
    if (groupPermissions) {
      for (const permission of groupPermissions) {
        combinedPermissions.add(permission);
      }
    }
  }

  return combinedPermissions;
}

// Export functions directly
export default {
  loadPermissions,
  getPermissionsForGroups
};

/**
 * @file types.authorization.ts
 * Version: 1.0.0
 * Type definitions for authorization subsystem (RBAC/ABAC).
 * Backend file.
 */

/**
 * Authorization context attached to the request after permission check.
 * Defines the effective scope of access for the current user and resource.
 */
export interface AuthContext {
  effectiveScope: 'all' | 'own';
}

/**
 * Map of permissions: Group ID -> Set of Permission Keys
 */
export type PermissionMap = Map<string, Set<string>>;

/**
 * Interface for permission loaded from database
 */
export interface PermissionRecord {
  group_id: string;
  permission_key: string;
}


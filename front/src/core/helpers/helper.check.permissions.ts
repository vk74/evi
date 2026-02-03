/**
 * @file helper.check.permissions.ts
 * Version: 1.1.0
 * Helper functions for checking user permissions.
 * Frontend file that provides universal functions to check access rights against the user's permission set.
 *
 * Changes in v1.1.0:
 * - can, canAll, canAny now require user to be authenticated (isAuthenticated) before checking permissions
 * - Prevents Admin module visibility for unauthenticated users when stale permissions are loaded from localStorage
 */

import { useUserAuthStore } from '@/core/auth/state.user.auth'

/**
 * Checks if the current user has a specific permission.
 * Returns false if user is not authenticated; otherwise checks against the loaded permissions set.
 *
 * @param permission - The permission key to check (e.g. 'admin.products:read')
 * @returns boolean - true if user is authenticated and has the permission
 */
export function can(permission: string): boolean {
  const store = useUserAuthStore()
  if (!store.isAuthenticated) {
    return false
  }
  if (!store.permissions) {
    return false
  }
  return store.permissions.has(permission)
}

/**
 * Checks if the current user has ALL of the specified permissions.
 * Returns false if user is not authenticated.
 *
 * @param permissions - Array of permission keys to check
 * @returns boolean - true if user is authenticated and has ALL permissions
 */
export function canAll(permissions: string[]): boolean {
  const store = useUserAuthStore()
  if (!store.isAuthenticated) {
    return false
  }
  if (!store.permissions) {
    return false
  }
  return permissions.every(p => store.permissions.has(p))
}

/**
 * Checks if the current user has ANY of the specified permissions.
 * Returns false if user is not authenticated.
 *
 * @param permissions - Array of permission keys to check
 * @returns boolean - true if user is authenticated and has ANY of the permissions
 */
export function canAny(permissions: string[]): boolean {
  const store = useUserAuthStore()
  if (!store.isAuthenticated) {
    return false
  }
  if (!store.permissions) {
    return false
  }
  return permissions.some(p => store.permissions.has(p))
}


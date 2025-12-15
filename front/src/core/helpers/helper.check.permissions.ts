/**
 * @file helper.check.permissions.ts
 * Version: 1.0.0
 * Helper functions for checking user permissions.
 * Frontend file that provides universal functions to check access rights against the user's permission set.
 */

import { useUserAuthStore } from '@/core/auth/state.user.auth'

/**
 * Checks if the current user has a specific permission.
 * Accesses the UserAuthStore to check against the loaded permissions set.
 * 
 * @param permission - The permission key to check (e.g. 'admin.products:read')
 * @returns boolean - true if user has the permission
 */
export function can(permission: string): boolean {
  const store = useUserAuthStore()
  // Check if permissions are loaded/exist
  if (!store.permissions) {
    return false
  }
  return store.permissions.has(permission)
}

/**
 * Checks if the current user has ALL of the specified permissions.
 * 
 * @param permissions - Array of permission keys to check
 * @returns boolean - true if user has ALL permissions
 */
export function canAll(permissions: string[]): boolean {
  const store = useUserAuthStore()
  if (!store.permissions) {
    return false
  }
  return permissions.every(p => store.permissions.has(p))
}

/**
 * Checks if the current user has ANY of the specified permissions.
 * Useful for checking if a user has access to at least one action in a group.
 * 
 * @param permissions - Array of permission keys to check
 * @returns boolean - true if user has ANY of the permissions
 */
export function canAny(permissions: string[]): boolean {
  const store = useUserAuthStore()
  if (!store.permissions) {
    return false
  }
  return permissions.some(p => store.permissions.has(p))
}


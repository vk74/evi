/**
 * service.get.permissions.ts - version 1.0.0
 * Service for retrieving user permissions.
 * 
 * Functionality:
 * - Gets user groups from database
 * - Retrieves effective permissions from in-memory cache
 * - Returns list of all permissions for the current user
 * 
 * Backend file - service.get.permissions.ts
 */

import { Request } from 'express';
import { AuthenticatedRequest } from '../guards/types.guards';
import permissionService from './service.permissions';
import { getUserGroups } from '../helpers/get.user.groups';

/**
 * Response interface for permissions endpoint
 */
export interface GetPermissionsResponse {
    success: boolean;
    permissions: string[];
    message?: string;
}

/**
 * Gets all effective permissions for the current user
 * 
 * @param req - Express Request object with authenticated user
 * @returns Promise<GetPermissionsResponse> - List of permission keys
 */
export async function getPermissions(req: Request): Promise<GetPermissionsResponse> {
    try {
        const authReq = req as AuthenticatedRequest;
        
        // Check if user is authenticated
        if (!authReq.user || !authReq.user.user_id) {
            return {
                success: false,
                permissions: [],
                message: 'User not authenticated'
            };
        }

        const userUuid = authReq.user.user_id;

        // Get user groups from database
        const userGroups = await getUserGroups(userUuid);

        // Get effective permissions from in-memory cache
        const effectivePermissions = permissionService.getPermissionsForGroups(userGroups);

        // Convert Set to Array for JSON response
        const permissionsArray = Array.from(effectivePermissions);

        return {
            success: true,
            permissions: permissionsArray
        };

    } catch (error) {
        return {
            success: false,
            permissions: [],
            message: error instanceof Error ? error.message : 'Failed to retrieve permissions'
        };
    }
}
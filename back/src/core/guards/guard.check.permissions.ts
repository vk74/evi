/**
 * @file guard.check.permissions.ts
 * Version: 1.0.0
 * Guard for checking user permissions against required base permission.
 * Implements logic for determining effective scope ('all' vs 'own').
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './types.guards';
import permissionService from '../auth/service.permissions';
import { getUserGroups } from '../helpers/get.user.groups';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { PERMISSION_CHECK_EVENTS } from '../auth/events.authorization';

/**
 * Factory function to create a permission check guard.
 * @param requiredBasePermission Base permission key (e.g. 'admin.products:items:read')
 * @returns Express middleware function
 */
export const checkPermissions = (requiredBasePermission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Check if user is authenticated (should be handled by previous guard, but safe check)
      if (!req.user || !req.user.user_id) {
         await createAndPublishEvent({
          eventName: PERMISSION_CHECK_EVENTS['check.denied'].eventName,
          payload: { 
            reason: 'User not authenticated',
            requiredPermission: requiredBasePermission
          }
        });
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const userUuid = req.user.user_id;

      // 2. Get user groups
      const userGroups = await getUserGroups(userUuid);

      // 3. Get effective permissions
      const effectivePermissions = permissionService.getPermissionsForGroups(userGroups);

      // 4. Check specific permissions to determine scope
      const permissionAll = `${requiredBasePermission}:all`;
      const permissionOwn = `${requiredBasePermission}:own`;
      
      let effectiveScope: 'all' | 'own' | null = null;

      if (effectivePermissions.has(permissionAll)) {
        effectiveScope = 'all';
      } else if (effectivePermissions.has(permissionOwn)) {
        effectiveScope = 'own';
      }

      // 5. Handle result
      if (effectiveScope) {
        // Access granted
        req.authContext = {
          effectiveScope
        };

        await createAndPublishEvent({
          eventName: PERMISSION_CHECK_EVENTS['check.granted'].eventName,
          payload: { 
            userUuid, 
            permission: requiredBasePermission,
            scope: effectiveScope,
            method: req.method,
            path: req.originalUrl,
            ip: req.ip
          }
        });

        next();
      } else {
        // Access denied
        await createAndPublishEvent({
          eventName: PERMISSION_CHECK_EVENTS['check.denied'].eventName,
          payload: { 
            userUuid, 
            requiredPermission: requiredBasePermission,
            method: req.method,
            path: req.originalUrl,
            ip: req.ip
          }
        });

        res.status(403).json({ 
          message: 'Access denied: insufficient permissions',
          required: requiredBasePermission
        });
      }

    } catch (error) {
      await createAndPublishEvent({
        eventName: PERMISSION_CHECK_EVENTS['check.error'].eventName,
        payload: { 
          error: error instanceof Error ? error.message : String(error),
          requiredPermission: requiredBasePermission,
          method: req.method,
          path: req.originalUrl,
          userUuid: req.user?.user_id || 'unknown'
        },
        errorData: error instanceof Error ? error.message : String(error)
      });
      
      res.status(500).json({ message: 'Internal server error during authorization' });
    }
  };
};

export default checkPermissions;


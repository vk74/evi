/**
 * @file guard.check.settings.permissions.ts
 * Version: 1.0.0
 * Guard for checking permissions specifically for Settings operations (read/update).
 * Implements mapping from section paths to specific permissions.
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './types.guards';
import permissionService from '../auth/service.permissions';
import { getUserGroups } from '../helpers/get.user.groups';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { PERMISSION_CHECK_EVENTS } from '../auth/events.authorization';

// Mapping of Section Path prefixes to Base Permission Keys
const SECTION_PERMISSION_MAP: Record<string, string> = {
  'AdminProducts': 'adminProducts:settings',
  'AdminPricing': 'adminPricing:settings',
  'AdminCatalog': 'adminCatalog:settings',
  'AdminServices': 'adminCatalog:settings', // Services share adminCatalog settings
  'OrganizationManagement': 'adminOrg:settings',
};

const DEFAULT_UPDATE_PERMISSION_BASE = 'adminOrg:settings';
const DEFAULT_READ_PERMISSION = 'settings:read:common';

/**
 * Factory function to create a settings permission check guard.
 * @param action 'read' | 'update'
 * @returns Express middleware function
 */
export const checkSettingsPermissions = (action: 'read' | 'update') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Check authentication
      if (!req.user || !req.user.user_id) {
        await createAndPublishEvent({
          eventName: PERMISSION_CHECK_EVENTS['check.denied'].eventName,
          payload: { 
            reason: 'User not authenticated',
            context: 'settings',
            action
          }
        });
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const userUuid = req.user.user_id;

      // 2. Extract sectionPath from body
      const { sectionPath } = req.body;
      
      if (!sectionPath && req.path.includes('all')) {
         // Special case for fetching ALL settings (if supported) or handling bulk operations
         // If no sectionPath provided, we might need a generic check or deny.
         // For now, assuming sectionPath is required for granular check.
         // If it's "fetch all settings", the controller might handle filtering based on permissions,
         // but here we are checking Access.
         // If request is "Fetch All", we might skip granular check here and let service filter?
         // Or require at least ONE permission?
         // Let's assume for "Fetch All", we don't use this guard or it passes if user has ANY settings permission?
         // The plan says "Apply checkSettingsPermissions('read') to /api/core/settings/fetch-settings".
         // fetch-settings can be type='all'.
      }

      // Determine required permission
      let requiredPermission = '';
      let isCommon = false;
      let isPrivileged = false;

      if (!sectionPath) {
        // Fallback for "all" or missing path: requires basic read access
        if (action === 'read') {
             requiredPermission = DEFAULT_READ_PERMISSION;
             isCommon = true;
             // Note: privileged access will be determined by what user HAS, not what is required here.
             // But for the guard to pass, they need at least common read.
        } else {
             // Update requires specific section
             res.status(400).json({ message: 'Section path is required for updates' });
             return;
        }
      } else {
          const prefix = sectionPath.split('.')[0];
          
          if (SECTION_PERMISSION_MAP[prefix]) {
              requiredPermission = `${SECTION_PERMISSION_MAP[prefix]}:${action}`;
              isPrivileged = true; // Admin sections are always privileged
          } else {
              // Application.*, Work.*, etc.
              if (action === 'update') {
                  requiredPermission = `${DEFAULT_UPDATE_PERMISSION_BASE}:${action}`;
                  isPrivileged = true; // Updating common settings is privileged (adminOrg)
              } else {
                  requiredPermission = DEFAULT_READ_PERMISSION;
                  isCommon = true;
              }
          }
      }

      // 3. Get user permissions
      const userGroups = await getUserGroups(userUuid);
      const effectivePermissions = permissionService.getPermissionsForGroups(userGroups);

      // 4. Verify Permission
      let accessGranted = false;
      let effectiveScope: 'all' | 'own' = 'all'; // Default to all if not specified (for common)

      if (isCommon) {
          // Check exact match for common permission
          if (effectivePermissions.has(requiredPermission)) {
              accessGranted = true;
          } else {
              // Even if common is required, Sysadmins/Admins might have specific permissions but maybe not 'common' explicit?
              // Migration gave sysadmins 'settings:read:common'.
              // Other admins might NOT have 'settings:read:common' explicitly if we didn't give it?
              // But 'role.users.registered' has it. All users are in it. So Admins are also in it.
              // So they should have it.
          }
      } else {
          // Check for :all or :own suffix (Admin Permissions)
          // requiredPermission is e.g. 'adminProducts:settings:read'
          // We check 'adminProducts:settings:read:all'
          // We don't support :own for settings currently (no "own settings"), so just :all
          const permAll = `${requiredPermission}:all`;
          
          if (effectivePermissions.has(permAll)) {
              accessGranted = true;
              effectiveScope = 'all';
          }
      }

      // 5. Determine if user has privileged access (for confidentiality check)
      // If the USER has any Admin Settings permission (even if we only checked Common), we mark as privileged?
      // Or strictly if they passed a Privileged check?
      // If I request 'Application.Appearance' (Common Read), I get 'settings:read:common'. Access Granted.
      // But if I am Admin, I should see confidential settings too?
      // The plan says: "Store strict permission flag ... to control confidentiality".
      // We should check if user has Admin permissions generally or for this specific section?
      // If I am AdminProducts, I should see confidential settings for AdminProducts, but maybe not for AdminOrg?
      // The code in service.fetch.settings.ts currently had `isAdmin = true` global.
      // We want granular.
      // So `isPrivilegedSettingsAccess` should be true if the user has `:all` permission for the REQUESTED section.
      
      // If we used `isCommon` check (e.g. Application.* read), does user have privileged access to Application.*?
      // Application.* maps to `adminOrg:settings` for update.
      // Does user have `adminOrg:settings:read:all`?
      // If so, they are privileged for Application.*.
      
      // So, additionally check for privileged permission if we fell back to common.
      let finalPrivilegedStatus = isPrivileged && accessGranted;
      
      if (!finalPrivilegedStatus && isCommon && sectionPath) {
          // We checked common read, but let's see if user is Admin for this section
          // For Application.* etc, admin is adminOrg.
          const adminPermBase = SECTION_PERMISSION_MAP[sectionPath.split('.')[0]] || DEFAULT_UPDATE_PERMISSION_BASE;
          // Check if user has read/update permission for this admin scope
          // We can check `adminOrg:settings:read:all`
          const checkPerm = `${adminPermBase}:read:all`;
          if (effectivePermissions.has(checkPerm)) {
              finalPrivilegedStatus = true;
          }
          // Also check update permission just in case
          const checkPermUpdate = `${adminPermBase}:update:all`;
          if (effectivePermissions.has(checkPermUpdate)) {
              finalPrivilegedStatus = true;
          }
      }


      if (accessGranted) {
        req.authContext = {
          effectiveScope,
          isPrivilegedSettingsAccess: finalPrivilegedStatus
        };

        await createAndPublishEvent({
          eventName: PERMISSION_CHECK_EVENTS['check.granted'].eventName,
          payload: { 
            userUuid, 
            permission: requiredPermission,
            scope: effectiveScope,
            isPrivileged: finalPrivilegedStatus,
            path: req.originalUrl
          }
        });

        next();
      } else {
        await createAndPublishEvent({
          eventName: PERMISSION_CHECK_EVENTS['check.denied'].eventName,
          payload: { 
            userUuid, 
            requiredPermission,
            path: req.originalUrl
          }
        });

        res.status(403).json({ 
          message: 'Access denied: insufficient permissions',
          required: requiredPermission
        });
      }

    } catch (error) {
      await createAndPublishEvent({
        eventName: PERMISSION_CHECK_EVENTS['check.error'].eventName,
        payload: { 
          error: error instanceof Error ? error.message : String(error),
          context: 'checkSettingsPermissions'
        },
        errorData: error instanceof Error ? error.message : String(error)
      });
      
      res.status(500).json({ message: 'Internal server error during authorization' });
    }
  };
};

export default checkSettingsPermissions;


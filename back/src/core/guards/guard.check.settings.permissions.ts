/**
 * @file guard.check.settings.permissions.ts
 * Version: 1.2.0
 * Guard for checking permissions specifically for Settings operations (read/update).
 * Implements strict mapping from section paths to specific permissions.
 * 
 * Changes in v1.1.0:
 * - Removed DEFAULT_UPDATE_PERMISSION_BASE fallback
 * - Added explicit mapping for 'Application', 'Work', 'Reports', 'KnowledgeBase' to 'system:settings'
 * - Enforced strict RBAC: users can only update settings if they have the specific permission for that section
 * 
 * Changes in v1.2.0:
 * - Added support for reading system settings (Application.*, Work, Reports, KnowledgeBase) with common permission
 * - For read operations on system settings: allows access with 'settings:read:common' if includeConfidential=false or isPublicOnly=true
 * - For read operations requesting confidential system settings: still requires 'system:settings:read:all'
 * - For update operations on system settings: still requires 'system:settings:update:all' (unchanged)
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './types.guards';
import permissionService from '../auth/service.permissions';
import { getUserGroups } from '../helpers/get.user.groups';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { PERMISSION_CHECK_EVENTS } from '../auth/events.authorization';

// Mapping of Section Path prefixes to Base Permission Keys
const SECTION_PERMISSION_MAP: Record<string, string> = {
  // Module-specific Admin Sections
  'AdminProducts': 'adminProducts:settings',
  'AdminPricing': 'adminPricing:settings',
  'AdminCatalog': 'adminCatalog:settings',
  'AdminServices': 'adminCatalog:settings', // Services share adminCatalog settings
  'AdminOrgMgmt': 'adminOrg:settings',

  // System-wide Sections (Restricted to sysadmins)
  'Application': 'system:settings',
  'Work': 'system:settings',
  'Reports': 'system:settings',
  'KnowledgeBase': 'system:settings',
};

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

      // 2. Extract sectionPath and request parameters from body
      const { sectionPath, includeConfidential, isPublicOnly } = req.body;
      
      // Determine required permission
      let requiredPermission = '';
      let isCommon = false;
      let isPrivileged = false;

      if (!sectionPath) {
        // Fallback for "all" or missing path: requires basic read access
        if (action === 'read') {
             requiredPermission = DEFAULT_READ_PERMISSION;
             isCommon = true;
        } else {
             // Update requires specific section
             res.status(400).json({ message: 'Section path is required for updates' });
             return;
        }
      } else {
          const prefix = sectionPath.split('.')[0];
          const mappedPermission = SECTION_PERMISSION_MAP[prefix];
          
          if (mappedPermission) {
              // Special handling for system settings (Application.*, Work, Reports, KnowledgeBase)
              if (mappedPermission === 'system:settings' && action === 'read') {
                  // For reading system settings:
                  // - If not requesting confidential settings, allow with common permission
                  // - If requesting confidential settings, require system:settings:read:all
                  const requestingConfidential = includeConfidential === true;
                  const requestingPublicOnly = isPublicOnly === true;
                  
                  if (!requestingConfidential || requestingPublicOnly) {
                      // Allow reading non-confidential system settings with common permission
                      requiredPermission = DEFAULT_READ_PERMISSION;
                      isCommon = true;
                      // Note: isPrivileged remains false for common permission access
                  } else {
                      // Require system permission for confidential settings
                      requiredPermission = `${mappedPermission}:${action}`;
                      isPrivileged = true;
                  }
              } else {
                  // For admin sections or system settings updates: use mapped permission
                  requiredPermission = `${mappedPermission}:${action}`;
                  // Any mapped permission (admin* or system) is considered privileged relative to 'common'
                  isPrivileged = true;
              }
          } else {
              // Unknown section
              if (action === 'read') {
                  // Allow reading unknown sections with common permission (fallback)
                  // This allows non-critical settings to be read if they don't have a specific map
                  requiredPermission = DEFAULT_READ_PERMISSION;
                  isCommon = true;
              } else {
                  // STRICT: Deny update for unknown sections
                  await createAndPublishEvent({
                    eventName: PERMISSION_CHECK_EVENTS['check.denied'].eventName,
                    payload: { 
                      userUuid, 
                      reason: `Unknown settings section: ${prefix}`,
                      path: req.originalUrl
                    }
                  });
                  res.status(403).json({ message: `Access denied: unknown settings section '${prefix}'` });
                  return;
              }
          }
      }

      // 3. Get user permissions
      const userGroups = await getUserGroups(userUuid);
      const effectivePermissions = permissionService.getPermissionsForGroups(userGroups);

      // 4. Verify Permission
      let accessGranted = false;
      let effectiveScope: 'all' | 'own' = 'all';

      if (isCommon) {
          // Check for common permission
          if (effectivePermissions.has(requiredPermission)) {
              accessGranted = true;
          }
      } else {
          // Check for :all permission
          // requiredPermission is e.g. 'system:settings:update'
          // We check 'system:settings:update:all'
          const permAll = `${requiredPermission}:all`;
          
          if (effectivePermissions.has(permAll)) {
              accessGranted = true;
              effectiveScope = 'all';
          }
      }

      // 5. Determine if user has privileged access (for confidentiality check)
      let finalPrivilegedStatus = isPrivileged && accessGranted;
      
      // If we fell back to common read, check if user happens to be an admin for this section anyway
      if (!finalPrivilegedStatus && isCommon && sectionPath) {
          const prefix = sectionPath.split('.')[0];
          const mappedPermission = SECTION_PERMISSION_MAP[prefix];
          
          if (mappedPermission) {
              // Check if user has read permission for this specific scope
              const checkPerm = `${mappedPermission}:read:all`;
              if (effectivePermissions.has(checkPerm)) {
                  finalPrivilegedStatus = true;
              }
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

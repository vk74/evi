/**
 * version: 1.5.0
 * Core routes for global backend services.
 * 
 * Functionality:
 * - Defines API endpoints under /api/core/... for core services
 * - Includes rate limiting, JWT validation and user status check middleware
 * - Routes requests to appropriate controllers for user management, group operations, password changes, and settings management
 * File: routes.core.ts
 * 
 * Changes in v1.0.05:
 * - Added active price list IDs endpoint /api/core/pricelists/active/ids
 * 
 * Changes in v1.1.0:
 * - Added rate limit guard as first guard in all routes for DDoS protection
 * 
 * Changes in v1.2.0:
 * - Removed add-users-to-group, add-user-to-groups, and change-group-owner routes (moved to admin routes)
 * 
 * Changes in v1.3.0:
 * - Added checkPermissions guard to admin password reset route
 * - Admin password reset now requires adminOrg:users:reset_password permission
 * 
 * Changes in v1.4.0:
 * - Added checkSettingsPermissions guard to settings routes for granular RBAC
 * 
 * Changes in v1.5.0:
 * - Removed countries list endpoint /api/core/countries/list (unused; regions from app.regions used instead)
 */

import express, { Router } from 'express';
import checkRateLimit from '../guards/guard.rate.limit';
import validateJWT from '../guards/guard.validate.jwt';
import checkIsUserStatusActive from '../guards/guard.check.is.user.status.active';
import checkRequestSecurityHard from '../guards/guard.check.request.security.hard';
import { checkPermissions } from '../guards/guard.check.permissions';
import checkSettingsPermissions from '../guards/guard.check.settings.permissions';

// Импорт контроллеров
import getUsernameByUuidController from '../controllers/controller.get.username.by.uuid';
import getActivePriceListIdsController from '../controllers/controller.get.active.pricelist.ids';
import searchUsers from '../services/item-selector/controller.search.users';
import searchGroups from '../services/item-selector/controller.search.groups';

import selfChangePasswordController from '../services/change-password/controller.self.change.password';
import adminResetPasswordController from '../services/change-password/controller.admin.change.password';
import fetchSettingsController from '../../modules/admin/settings/controller.fetch.settings';
import updateSettingsController from '../../modules/admin/settings/controller.update.settings';

const router: Router = express.Router();

// utility services
router.get('/api/core/users/fetch-username-by-uuid/:userId', checkRateLimit, validateJWT, checkIsUserStatusActive, getUsernameByUuidController);
router.get('/api/core/pricelists/active/ids', checkRateLimit, validateJWT, checkIsUserStatusActive, getActivePriceListIdsController);

// item selector universal component services
router.get('/api/core/item-selector/search-users', checkRateLimit, validateJWT, checkIsUserStatusActive, searchUsers); 
router.get('/api/core/item-selector/search-groups', checkRateLimit, validateJWT, checkIsUserStatusActive, searchGroups);

// change password universal component
router.post('/api/core/users/self-change-password', checkRateLimit, validateJWT, checkIsUserStatusActive, selfChangePasswordController);
router.post('/api/core/users/admin-change-password', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, checkPermissions('adminOrg:users:reset_password'), adminResetPasswordController);

// settings services
router.post('/api/core/settings/fetch-settings', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, checkSettingsPermissions('read'), fetchSettingsController);
router.post('/api/core/settings/update-settings', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, checkSettingsPermissions('update'), updateSettingsController);

// Export using ES modules syntax
export default router;
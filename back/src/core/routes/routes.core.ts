/**
 * version: 1.0.02
 * Core routes for global backend services.
 * 
 * Functionality:
 * - Defines API endpoints under /api/core/... for core services
 * - Includes authentication middleware (validateJWT) and user status check middleware
 * - Routes requests to appropriate controllers for user management, group operations, password changes, and settings management
 * File: routes.core.ts
 */

import express, { Router } from 'express';
import validateJWT from '../guards/guard.validate.jwt';
import checkIsUserStatusActive from '../guards/guard.check.is.user.status.active';

// Импорт контроллеров
import getUsernameByUuidController from '../controllers/controller.get.username.by.uuid';
import searchUsers from '../services/item-selector/controller.search.users';
import searchGroups from '../services/item-selector/controller.search.groups';
import addUsersToGroup from '../services/item-selector/controller.add.users.to.group';
import changeGroupOwner from '../services/item-selector/controller.change.group.owner';

import selfChangePasswordController from '../services/change-password/controller.self.change.password';
import adminResetPasswordController from '../services/change-password/controller.admin.change.password';
import fetchSettingsController from '../../modules/admin/settings/controller.fetch.settings';
import updateSettingsController from '../../modules/admin/settings/controller.update.settings';

const router: Router = express.Router();

// utility services
router.get('/api/core/users/fetch-username-by-uuid/:userId', validateJWT, checkIsUserStatusActive, getUsernameByUuidController);

// item selector universal component services
router.get('/api/core/item-selector/search-users', validateJWT, checkIsUserStatusActive, searchUsers); 
router.get('/api/core/item-selector/search-groups', validateJWT, checkIsUserStatusActive, searchGroups);
router.post('/api/core/item-selector/add-users-to-group', validateJWT, checkIsUserStatusActive, addUsersToGroup);
router.post('/api/core/item-selector/change-group-owner', validateJWT, checkIsUserStatusActive, changeGroupOwner);

// change password universal component
router.post('/api/core/users/self-change-password', validateJWT, checkIsUserStatusActive, selfChangePasswordController);
router.post('/api/core/users/admin-change-password', validateJWT, checkIsUserStatusActive, adminResetPasswordController);

// settings services
router.post('/api/core/settings/fetch-settings', validateJWT, checkIsUserStatusActive, fetchSettingsController);
router.post('/api/core/settings/update-settings', validateJWT, checkIsUserStatusActive, updateSettingsController);

// Export using ES modules syntax
export default router;
/**
 * version: 1.0.01
 * Core routes for global backend services.
 * 
 * Functionality:
 * - Defines API endpoints under /api/core/... for core services
 * - Includes authentication middleware (validateJWT)
 * - Routes requests to appropriate controllers for user management, group operations, password changes, and settings management
 * File: routes.core.ts
 */

import express, { Router } from 'express';
import validateJWT from '../../guards/auth.validate.jwt';

// Импорт контроллеров
import getUsernameByUuidController from '../middleware/controller.get.username.by.uuid';
import searchUsers from '../services/item-selector/controller.search.users';
import addUsersToGroup from '../services/item-selector/controller.add.users.to.group';
import changeGroupOwner from '../services/item-selector/controller.change.group.owner';

import selfChangePasswordController from '../services/change-password/controller.self.change.password';
import adminResetPasswordController from '../services/change-password/controller.admin.change.password';
import fetchSettingsController from '../services/settings/controller.fetch.settings';
import updateSettingsController from '../services/settings/controller.update.settings';

const router: Router = express.Router();

// utility services
router.get('/api/core/users/fetch-username-by-uuid/:userId', validateJWT, getUsernameByUuidController);

// item selector universal component services
router.get('/api/core/item-selector/search-users', validateJWT, searchUsers); 
router.post('/api/core/item-selector/add-users-to-group', validateJWT, addUsersToGroup);
router.post('/api/core/item-selector/change-group-owner', validateJWT, changeGroupOwner);

// change password universal component
router.post('/api/core/users/self-change-password', validateJWT, selfChangePasswordController);
router.post('/api/core/users/admin-change-password', validateJWT, adminResetPasswordController);

// settings services
router.post('/api/core/settings/fetch-settings', validateJWT, fetchSettingsController);
router.post('/api/core/settings/update-settings', validateJWT, updateSettingsController);

// Export using ES modules syntax
export default router;
/**
 * routes.core.js
 * Core routes for global backend services.
 * 
 * Functionality:
 * - Defines API endpoints under /api/core/... for core services
 * - Includes authentication middleware (validateJWT)
 * - Routes requests to appropriate services
 */

const express = require('express');
const router = express.Router();
const validateJWT = require('../../guards/auth.validate.jwt');

// Импорт контроллеров (используем .default для ES Module exports)
const fetchUsernameByUuid = require('../services/service.fetch.username.by.uuid').default;
const searchUsers = require('../services/item-selector/controller.search.users').default;
const addUsersToGroup = require('../services/item-selector/controller.add.users.to.group').default;

const selfChangePasswordController = require('../services/change-password/controller.self.change.password').default;
const adminResetPasswordController = require('../services/change-password/controller.admin.change.password').default;


// utility services
router.get('/api/core/users/fetch-username-by-uuid/:userId', validateJWT, fetchUsernameByUuid);

// item selector universal component services
router.get('/api/core/item-selector/search-users', validateJWT, searchUsers); 
router.post('/api/core/item-selector/add-users-to-group', validateJWT, addUsersToGroup);

// change password universal component
router.post('/api/core/users/self-change-password', validateJWT, selfChangePasswordController);
router.post('/api/core/users/admin-change-password', validateJWT, adminResetPasswordController);

module.exports = router;
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

const fetchUsernameByUuid = require('../services/service.fetch.username.by.uuid').default; // Явно получаем функцию через .default
const searchUsers = require('../services/item-selector/controller.search.users').default;
const addUsersToGroup = require('../services/item-selector/controller.add.users.to.group');

// User services
router.get('/api/core/users/fetch-username-by-uuid/:userId', validateJWT, fetchUsernameByUuid);

// Item selector services
router.get('/api/core/item-selector/search-users', validateJWT, searchUsers);
router.post('/api/core/item-selector/add-users-to-group', validateJWT, addUsersToGroup);

module.exports = router;
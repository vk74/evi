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

router.get('/api/core/users/fetch-username-by-uuid/:userId', validateJWT, fetchUsernameByUuid);

router.get('/api/core/item-selector/search-users', validateJWT, searchUsers); 

module.exports = router;
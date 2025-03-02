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
const fetchUsernameByUuid = require('../services/service.fetch.username.by.uuid').default; // Явно получаем функцию через .default
const validateJWT = require('../../guards/auth.validate.jwt');

/**
 * Route to fetch username by user UUID
 * Requires JWT authentication
 */
router.get('/api/core/users/fetch-username-by-uuid/:userId', validateJWT, fetchUsernameByUuid);

// /api/core/item-search
// /api/core/item-action

module.exports = router;
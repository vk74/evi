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
router.get('/users/fetch-username-by-uuid/:userId', validateJWT, fetchUsernameByUuid);

module.exports = router;
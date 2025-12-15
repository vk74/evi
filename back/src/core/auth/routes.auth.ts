/**
 * version: 1.1.0
 * Backend router file for authentication related routes.
 * Handles user authentication, registration, profile management and routes to appropriate middleware.
 * Protected routes include rate limiting, JWT validation and user status check middleware.
 * File: routes.auth.ts
 * 
 * Changes in v1.1.0:
 * - Added rate limit guard as first guard in all routes for DDoS protection
 */

import express, { Router } from 'express';
import checkRateLimit from '../guards/guard.rate.limit';
import validateJWT from '../guards/guard.validate.jwt';
import checkIsUserStatusActive from '../guards/guard.check.is.user.status.active';
import checkRequestSecurityHard from '../guards/guard.check.request.security.hard';
// Removed: checkAccountPassword, checkAccountStatus - not used in routes
// import issueToken from '../../middleware/auth.issue.token';
// Registration service moved to controller
import fetchUserProfileController from '../../modules/account/controller.fetch.profile';
import updateUserProfileController from '../../modules/account/controller.update.profile';

// Import new controllers
import { loginController } from './controller.login';
import { refreshTokensController } from './controller.refresh.tokens';
import { logoutController } from './controller.logout';
import getPermissionsController from './controller.get.permissions';
// import serviceChangePassword from '../../modules/account/service.change.password';

const router: Router = express.Router();


// New authentication routes
router.post('/api/auth/login', checkRateLimit, checkRequestSecurityHard, loginController);

router.post('/api/auth/refresh', checkRateLimit, checkRequestSecurityHard, refreshTokensController);

router.post('/api/auth/logout', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, logoutController);

// Existing routes (updated imports)
router.post('/api/auth/change-password', checkRateLimit, checkRequestSecurityHard, (req, res) => {
    // TODO: Replace with serviceChangePassword when created
    res.status(501).json({ error: 'Change password service not implemented yet' });
});
router.get('/api/auth/profile', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchUserProfileController);
router.post('/api/auth/profile', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateUserProfileController);
router.get('/api/auth/permissions', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, getPermissionsController);



// Export using ES modules syntax
export default router; 
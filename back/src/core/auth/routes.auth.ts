/**
 * version: 1.0.06
 * Backend router file for authentication related routes.
 * Handles user authentication, registration, profile management and routes to appropriate middleware.
 * Protected routes include user status check middleware.
 * File: routes.auth.ts
 */

import express, { Router } from 'express';
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
// import serviceChangePassword from '../../modules/account/service.change.password';

const router: Router = express.Router();


// New authentication routes
router.post('/api/auth/login', checkRequestSecurityHard, loginController);

router.post('/api/auth/refresh', checkRequestSecurityHard, refreshTokensController);

router.post('/api/auth/logout', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, logoutController);

// Existing routes (updated imports)
router.post('/api/auth/change-password', checkRequestSecurityHard, (req, res) => {
    // TODO: Replace with serviceChangePassword when created
    res.status(501).json({ error: 'Change password service not implemented yet' });
});
router.get('/api/auth/profile', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchUserProfileController);
router.post('/api/auth/profile', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateUserProfileController);



// Export using ES modules syntax
export default router; 
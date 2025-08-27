/**
 * version: 1.0.04
 * Backend router file for authentication related routes.
 * Handles user authentication, registration, profile management and routes to appropriate middleware.
 * Protected routes include user status check middleware.
 * File: routes.auth.ts
 */

import express, { Router } from 'express';
import validateJWT from '../guards/guard.validate.jwt';
import checkIsUserStatusActive from '../guards/guard.check.is.user.status.active';
// Removed: checkAccountPassword, checkAccountStatus - not used in routes
// import issueToken from '../../middleware/auth.issue.token';
// Registration service moved to controller
import getUserProfile from '../../modules/account/service.get.profile';
import updateUserProfile from '../../modules/account/service.update.profile';
import fetchPublicPasswordPoliciesController from '../public/controller.fetch.public.password.policies';
import getRegistrationStatusController from '../public/controller.public.registration.status';

// Import new controllers
import { loginController } from './controller.login';
import { refreshTokensController } from './controller.refresh.tokens';
import { logoutController } from './controller.logout';
// import serviceChangePassword from '../../modules/account/service.change.password';

const router: Router = express.Router();

// Public routes (no authentication required)
router.get('/api/public/password-policies', fetchPublicPasswordPoliciesController);
router.get('/api/public/registration-status', getRegistrationStatusController);

// New authentication routes
router.post('/api/auth/login', loginController);

router.post('/api/auth/refresh', refreshTokensController);

router.post('/api/auth/logout', validateJWT, checkIsUserStatusActive, logoutController);

// Existing routes (updated imports)
router.post('/api/auth/change-password', (req, res) => {
    // TODO: Replace with serviceChangePassword when created
    res.status(501).json({ error: 'Change password service not implemented yet' });
});
router.get('/api/auth/profile', validateJWT, checkIsUserStatusActive, getUserProfile);
router.post('/api/auth/profile', validateJWT, checkIsUserStatusActive, updateUserProfile);



// Export using ES modules syntax
export default router; 
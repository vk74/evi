/**
 * version: 1.0.03
 * Backend router file for authentication related routes.
 * Handles user authentication, registration, profile management and routes to appropriate middleware.
 * File: routes.auth.ts
 */

import express, { Router } from 'express';
import validateJWT from '../guards/auth.validate.jwt';
import checkAccountPassword from '../../guards/auth.check.password';
import checkAccountStatus from '../../guards/auth.check.status';
import issueToken from '../../middleware/auth.issue.token';
import registerUser from '../../modules/account/service.register.user';
import getUserProfile from '../../modules/account/service.get.profile';
import updateUserProfile from '../../modules/account/service.update.profile';
import fetchPublicPasswordPoliciesController from './controller.fetch.public.password.policies';

// TODO: Import new controllers when they are created
// import controllerLogin from './controller.login';
// import controllerRefreshTokens from './controller.refresh.tokens';
// import controllerLogout from './controller.logout';
// import serviceChangePassword from '../../modules/account/service.change.password';

const router: Router = express.Router();

// Public routes (no authentication required)
router.get('/api/public/password-policies', fetchPublicPasswordPoliciesController);

// New authentication routes
router.post('/api/auth/login', (req, res) => {
    // TODO: Replace with controllerLogin when created
    res.status(501).json({ error: 'Login controller not implemented yet' });
});

router.post('/api/auth/refresh', (req, res) => {
    // TODO: Replace with controllerRefreshTokens when created
    res.status(501).json({ error: 'Refresh tokens controller not implemented yet' });
});

router.post('/api/auth/logout', (req, res) => {
    // TODO: Replace with controllerLogout when created
    res.status(501).json({ error: 'Logout controller not implemented yet' });
});

// Existing routes (updated imports)
router.post('/api/auth/register', registerUser);
router.post('/api/auth/change-password', (req, res) => {
    // TODO: Replace with serviceChangePassword when created
    res.status(501).json({ error: 'Change password service not implemented yet' });
});
router.get('/api/auth/profile', validateJWT, getUserProfile);
router.post('/api/auth/profile', validateJWT, updateUserProfile);

// Legacy routes (keeping for backward compatibility)
router.post('/register', registerUser);
router.post('/login', checkAccountPassword, checkAccountStatus, issueToken);
router.get('/profile', validateJWT, getUserProfile);
router.post('/profile', validateJWT, updateUserProfile);

// Export using ES modules syntax
export default router; 
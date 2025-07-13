/**
 * version: 1.0.02
 * Backend router file for authentication related routes.
 * Handles user authentication, registration, profile management and routes to appropriate middleware.
 * File: routes.auth.ts
 */

import express, { Router } from 'express';
import validateJWT from '../guards/auth.validate.jwt';
import checkAccountPassword from '../../guards/auth.check.password';
import checkAccountStatus from '../../guards/auth.check.status';
import issueToken from '../../middleware/auth.issue.token';
import registerUser from '../../middleware/auth.register.user';
import changeUserPassword from '../../middleware/users.change.password';
import getUserProfile from '../../middleware/users.get.profile';
import updateUserProfile from '../../middleware/users.update.profile';
import fetchPublicPasswordPoliciesController from './controller.fetch.public.password.policies';

const router: Router = express.Router();

// Public routes (no authentication required)
router.get('/api/public/password-policies', fetchPublicPasswordPoliciesController);

// User account routes
router.post('/register', registerUser);
router.post('/login', checkAccountPassword, checkAccountStatus, issueToken);
router.post('/changeuserpass', changeUserPassword);
router.get('/profile', validateJWT, getUserProfile);
router.post('/profile', validateJWT, updateUserProfile);

// Export using ES modules syntax
export default router; 
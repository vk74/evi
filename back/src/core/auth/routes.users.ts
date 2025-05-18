/**
 * version: 1.0.01
 * Backend router file for user account related routes.
 * Handles user authentication, registration, profile management and routes to appropriate middleware.
 * File: routes.users.ts
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

const router: Router = express.Router();

router.post('/register', registerUser);
router.post('/login', checkAccountPassword, checkAccountStatus, issueToken);
router.post('/changeuserpass', changeUserPassword);
router.get('/profile', validateJWT, getUserProfile);
router.post('/profile', validateJWT, updateUserProfile);

// Export using ES modules syntax
export default router;
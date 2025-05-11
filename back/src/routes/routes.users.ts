/**
 * version: 1.0.0
 * Backend router file for user account related routes.
 * Handles user authentication, registration, profile management and routes to appropriate middleware.
 * File: routes.users.ts
 */

import express, { Router } from 'express';
const router: Router = express.Router();

// Importing middleware using CommonJS syntax for compatibility
const validateJWT = require('../guards/auth.validate.jwt');
const checkAccountPassword = require('../guards/auth.check.password');
const checkAccountStatus = require('../guards/auth.check.status');
const issueToken = require('../middleware/auth.issue.token');
const registerUser = require('../middleware/auth.register.user');
const changeUserPassword = require('../middleware/users.change.password');
const getUserProfile = require('../middleware/users.get.profile');
const updateUserProfile = require('../middleware/users.update.profile');

router.post('/register', registerUser);
router.post('/login', checkAccountPassword, checkAccountStatus, issueToken);
router.post('/changeuserpass', changeUserPassword);
router.get('/profile', validateJWT, getUserProfile);
router.post('/profile', validateJWT, updateUserProfile);

// CommonJS module export for compatibility with server.js
module.exports = router;
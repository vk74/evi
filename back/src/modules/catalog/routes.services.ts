/**
 * version: 1.0.02
 * Backend router file for admin services.
 * Handles routes for service management functionality.
 * File: routes.services.ts
 */

import express, { Router } from 'express';
import getUserUUID from '../../middleware/users.get.uuid';
import validateJWT from '../../guards/auth.validate.jwt';
// import checkAccountStatus from '../guards/auth.check.status';
import { serviceEditor } from '../../middleware/services.editor';

const router: Router = express.Router();

// Создание нового сервиса
router.post('/api/admin/services', validateJWT, getUserUUID, serviceEditor);

// Export using ES modules syntax
export default router;
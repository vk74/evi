/**
 * version: 1.0.01
 * Backend router file for admin services.
 * Handles routes for service management functionality.
 * File: routes.services.ts
 */

import express, { Router } from 'express';
const router: Router = express.Router();

// Импортируем middleware используя CommonJS-совместимый синтаксис
const getUserUUID = require('../middleware/users.get.uuid');
const validateJWT = require('../guards/auth.validate.jwt');
// const checkAccountStatus = require('../guards/auth.check.status');
const { serviceEditor } = require('../middleware/services.editor');

// Создание нового сервиса
router.post('/api/admin/services', validateJWT, getUserUUID, serviceEditor);

// CommonJS module export for compatibility with server.js
module.exports = router;
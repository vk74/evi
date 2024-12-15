// File purpose: Routes for admin module services - handles routes for service management functionality

const express = require('express');
const router = express.Router();

const getUserUUID = require('../middleware/users.get.uuid');
const validateJWT = require('../guards/auth.validate.jwt');
// const checkAccountStatus = require('../guards/auth.check.status');
const { serviceEditor } = require('../middleware/services.editor');

// Создание нового сервиса
router.post('/api/admin/services', validateJWT, getUserUUID, serviceEditor);

module.exports = router;
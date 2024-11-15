const express = require('express');
const router = express.Router();

const getUserUUID = require('../middleware/getUserUUID');
const validateJWT = require('../guards/auth.validate.jwt');
// const checkAccountStatus = require('../guards/auth.check.status');
const { createService } = require('../middleware/services.editor');

// Создание нового сервиса
router.post('/api/admin/services', validateJWT, getUserUUID, createService);

module.exports = router;
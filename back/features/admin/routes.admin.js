// routes
// File purpose: Routes which handles administrative module operations

const express = require('express');
const router = express.Router();

// Middleware imports
const validateJWT = require('../../guards/auth.validate.jwt');
const newUserEditor = require('./users/usereditor/admin.users.usereditor.newuser');

/////////////// CATALOG SECTION ROUTES


/////////////// SERVICES SECTION ROUTES


/////////////// USER SECTION ROUTES


// Route for creating new user from admin panel
router.post('/api/admin/user/newuser', validateJWT, newUserEditor);


/////////////// APPLICATION SETTINGS SECTION ROUTES

module.exports = router;
// routes
// File purpose: Routes which handles administrative module operations

const express = require('express');
const router = express.Router();

// Middleware imports
const validateJWT = require('../../guards/auth.validate.jwt');
const newUserEditor = require('./users/usereditor/admin.users.usereditor.newuser');
//const getAllUsers = require('./users/viewAllUsers/controller.all.users');

// Route for creating new user from admin panel
router.post('/api/admin/user/newuser', validateJWT, newUserEditor);

// Route for getting list of all users
//router.get('/api/admin/users/view-all-users', validateJWT, getAllUsers);

/////////////// APPLICATION SETTINGS SECTION ROUTES

module.exports = router;
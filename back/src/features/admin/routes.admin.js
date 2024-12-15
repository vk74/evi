const express = require('express');
const router = express.Router();

const validateJWT = require('../../guards/auth.validate.jwt');
const newUserEditor = require('./users/usereditor/admin.users.usereditor.newuser');
const getAllUsers = require('./users/viewAllUsers/controller.view.all.users');

// Route for creating new user from admin panel
router.post('/api/admin/user/newuser', validateJWT, newUserEditor);
router.get('/api/admin/users/view-all-users', validateJWT, getAllUsers);

module.exports = router;
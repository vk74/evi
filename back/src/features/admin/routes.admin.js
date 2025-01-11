// routes.admin.js 

const express = require('express');
const router = express.Router();

const validateJWT = require('../../guards/auth.validate.jwt');
const newUserEditor = require('./users/usereditor/admin.users.usereditor.newuser');
const getAllUsers = require('./users/usersList/controller.view.all.users');
const deleteSelectedUsers = require('./users/usersList/controller.delete.selected.users');
const loadUserById = require('./users/userEditor/controller.load.user');

// Route for creating new user from admin panel
router.post('/api/admin/user/newuser', validateJWT, newUserEditor);

//return list of all registered users (partial details)
router.get('/api/admin/users/view-all-users', validateJWT, getAllUsers);

//return selected user by user id
router.get('/api/admin/users/fetch-user-by-userid/:userId', validateJWT, loadUserById);

// /api/admin/users/update-user-by-userid

//delete selected user by user id
router.post('/api/admin/users/delete-selected-users', validateJWT, deleteSelectedUsers);

module.exports = router;
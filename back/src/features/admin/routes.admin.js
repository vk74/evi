const express = require('express');
const router = express.Router();
const validateJWT = require('../../guards/auth.validate.jwt');

// Import controllers
const getAllUsers = require('./users/usersList/controller.view.all.users');
const updateUserById = require('./users/userEditor/controller.update.user');
const deleteSelectedUsers = require('./users/usersList/controller.delete.selected.users');
const loadUserById = require('./users/userEditor/controller.load.user');
const createUserController = require('./users/userEditor/controller.create.user');
const createGroupController = require('./users/groupEditor/controller.create.group');

// Routes Users
router.post('/api/admin/users/create-new-user', validateJWT, createUserController);
router.get('/api/admin/users/view-all-users', validateJWT, getAllUsers);
router.get('/api/admin/users/fetch-user-by-userid/:userId', validateJWT, loadUserById);
router.post('/api/admin/users/update-user-by-userid', validateJWT, updateUserById);
router.post('/api/admin/users/delete-selected-users', validateJWT, deleteSelectedUsers);

// Routes Groups
router.post('/api/admin/groups/create-new-group', validateJWT, createGroupController);
// /api/admin/groups/fetch-groups
// /api/admin/groups/update-group-by-groupid/:groupId
// /api/admin/groups/fetch-group-by-groupid/:groupId
// api/admin/users/delete-selected-groups


module.exports = router;
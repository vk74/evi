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
const fetchGroups = require('./users/groupsList/controller.groups.list').default;
const deleteSelectedGroupsController = require('./users/groupsList/controller.delete.selected.groups').default;
const fetchGroupById = require('./users/groupEditor/controller.fetch.group').default;
const updateGroupById = require('./users/groupEditor/controller.update.group');
const fetchGroupMembers = require('./users/groupEditor/controller.fetch.group.members').default;
const removeGroupMembers = require('./users/groupEditor/controller.delete.group.members').default;

// Routes for Users
router.post('/api/admin/users/create-new-user', validateJWT, createUserController);
router.get('/api/admin/users/view-all-users', validateJWT, getAllUsers);
router.get('/api/admin/users/fetch-user-by-userid/:userId', validateJWT, loadUserById);
router.post('/api/admin/users/update-user-by-userid', validateJWT, updateUserById);
router.post('/api/admin/users/delete-selected-users', validateJWT, deleteSelectedUsers);

// Routes for Groups
router.post('/api/admin/groups/create-new-group', validateJWT, createGroupController);
router.get('/api/admin/groups/fetch-groups', validateJWT, fetchGroups);
router.post('/api/admin/groups/delete-selected-groups', validateJWT, deleteSelectedGroupsController);
router.get('/api/admin/groups/fetch-group-by-groupid/:groupId', validateJWT, fetchGroupById);
router.post('/api/admin/groups/update-group-by-groupid', validateJWT, updateGroupById);
router.get('/api/admin/groups/:groupId/members', validateJWT, fetchGroupMembers);
router.post('/api/admin/groups/:groupId/members/remove', validateJWT, removeGroupMembers);

module.exports = router;
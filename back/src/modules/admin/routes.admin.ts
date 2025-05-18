/**
 * version: 1.0.04
 * Backend router file for admin functionality.
 * Defines routes for administrative functions focused on user and group management.
 * All routes are protected by JWT validation middleware.
 * File: routes.admin.ts
 */

import express, { Router } from 'express';
import validateJWT from '../../core/guards/auth.validate.jwt';

// Import controllers
import { fetchProtoUsers, deleteSelectedProtoUsers } from './users/usersListProto/routes.users.list.proto';
import updateUserById from './users/userEditor/controller.update.user';
import loadUserById from './users/userEditor/controller.load.user';
import createUserController from './users/userEditor/controller.create.user';
import createGroupController from './users/groupEditor/controller.create.group';
import fetchGroups from './users/groupsList/controller.groups.list';
import deleteSelectedGroupsController from './users/groupsList/controller.delete.selected.groups';
import fetchGroupById from './users/groupEditor/controller.fetch.group';
import updateGroupById from './users/groupEditor/controller.update.group';
import fetchGroupMembers from './users/groupEditor/controller.fetch.group.members';
import removeGroupMembers from './users/groupEditor/controller.delete.group.members';
import fetchUsers from './users/usersList/controller.users.list';
import deleteSelectedUsers from './users/usersList/controller.delete.selected.users';

const router: Router = express.Router();

// Routes for Users
router.post('/api/admin/users/create-new-user', validateJWT, createUserController);
router.get('/api/admin/users/fetch-users', validateJWT, fetchUsers);
router.get('/users/list', validateJWT, fetchUsers); // Дополнительный маршрут для совместимости с фронтендом
router.post('/users/delete', validateJWT, deleteSelectedUsers); // Дополнительный маршрут для совместимости с фронтендом
router.get('/api/admin/users/fetch-user-by-userid/:userId', validateJWT, loadUserById);
router.post('/api/admin/users/update-user-by-userid', validateJWT, updateUserById);
router.post('/api/admin/users/delete-selected-users', validateJWT, deleteSelectedUsers);

// Routes for Prototype Users List (legacy, keeping for compatibility)
router.get('/api/admin/users/proto/fetch-users', validateJWT, fetchProtoUsers);
router.post('/api/admin/users/proto/delete-selected-users', validateJWT, deleteSelectedProtoUsers);

// Routes for Groups
router.post('/api/admin/groups/create-new-group', validateJWT, createGroupController);
router.get('/api/admin/groups/fetch-groups', validateJWT, fetchGroups);
router.post('/api/admin/groups/delete-selected-groups', validateJWT, deleteSelectedGroupsController);
router.get('/api/admin/groups/fetch-group-by-groupid/:groupId', validateJWT, fetchGroupById);
router.post('/api/admin/groups/update-group-by-groupid', validateJWT, updateGroupById);
router.get('/api/admin/groups/:groupId/members', validateJWT, fetchGroupMembers);
router.post('/api/admin/groups/:groupId/members/remove', validateJWT, removeGroupMembers);

// Export using ES modules syntax
export default router;
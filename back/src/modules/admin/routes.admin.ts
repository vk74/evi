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
import { fetchUsers, deleteSelectedUsers } from './users/usersList/routes.users.list';
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
import fetchCatalogSections from './catalog/controller.admin.fetch.sections';
import createCatalogSection from './catalog/controller.admin.create.section';
import updateCatalogSection from './catalog/controller.admin.update.section';
import deleteCatalogSection from './catalog/controller.admin.delete.sections';
import createServiceController from './service/sections/controller.admin.create.service';
import updateServiceController from './service/sections/controller.admin.update.service';
import fetchPublishingSectionsController from './service/sections/controller.admin.fetch.publishingsections';
import updateSectionsPublishController from './service/sections/controller.admin.update.sections.publish';
import fetchAllServicesController from './service/sections/controller.admin.fetchallservices';
import fetchSingleServiceController from './service/sections/controller.admin.fetchsingleservice';
import deleteServicesController from './service/sections/controller.admin.deleteservices';

const router: Router = express.Router();

// Routes for Users
router.post('/api/admin/users/create-new-user', validateJWT, createUserController);
router.get('/api/admin/users/fetch-users', validateJWT, fetchUsers);
router.get('/users/list', validateJWT, fetchUsers);
router.post('/users/delete', validateJWT, deleteSelectedUsers);
router.get('/api/admin/users/fetch-user-by-userid/:userId', validateJWT, loadUserById);
router.post('/api/admin/users/update-user-by-userid/:userId', validateJWT, updateUserById);
router.post('/api/admin/users/delete-selected-users', validateJWT, deleteSelectedUsers);

// Routes for Groups
router.post('/api/admin/groups/create-new-group', validateJWT, createGroupController);
router.get('/api/admin/groups/fetch-groups', validateJWT, fetchGroups);
router.post('/api/admin/groups/delete-selected-groups', validateJWT, deleteSelectedGroupsController);
router.get('/api/admin/groups/fetch-group-by-groupid/:groupId', validateJWT, fetchGroupById);
router.post('/api/admin/groups/update-group-by-groupid', validateJWT, updateGroupById);
router.get('/api/admin/groups/:groupId/members', validateJWT, fetchGroupMembers);
router.post('/api/admin/groups/:groupId/members/remove', validateJWT, removeGroupMembers);

// Routes for Catalog
router.get('/api/admin/catalog/fetch-sections', validateJWT, fetchCatalogSections);
router.post('/api/admin/catalog/create-section', validateJWT, createCatalogSection);
router.post('/api/admin/catalog/update-section', validateJWT, updateCatalogSection);
router.post('/api/admin/catalog/delete-section', validateJWT, deleteCatalogSection);

// Routes for Services
router.post('/api/admin/services/create', validateJWT, createServiceController);
router.post('/api/admin/services/update', validateJWT, updateServiceController);
router.post('/api/admin/services/update-sections-publish', validateJWT, updateSectionsPublishController);
router.get('/api/admin/services/fetchallservices', validateJWT, fetchAllServicesController);
router.get('/api/admin/services/fetchpublishingsections', validateJWT, fetchPublishingSectionsController);
router.get('/api/admin/services/fetchsingleservice', validateJWT, fetchSingleServiceController);
router.post('/api/admin/services/deleteservices', validateJWT, deleteServicesController);

// Export using ES modules syntax
export default router;
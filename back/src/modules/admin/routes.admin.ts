/**
 * version: 1.0.05
 * Backend router file for admin functionality.
 * Defines routes for administrative functions focused on user and group management.
 * All routes are protected by JWT validation and user status check middleware.
 * File: routes.admin.ts
 */

import express, { Router } from 'express';
import validateJWT from '../../core/guards/guard.validate.jwt';
import checkIsUserStatusActive from '../../core/guards/guard.check.is.user.status.active';

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
import fetchPublishingServicesController from './catalog/controller.admin.fetch.publishingservices';
import updateSectionServicesPublishController from './catalog/controller.admin.update.services.publish';
import createServiceController from './service/sections/controller.admin.create.service';
import updateServiceController from './service/sections/controller.admin.update.service';
import fetchPublishingSectionsController from './service/sections/controller.admin.fetch.publishingsections';
import updateSectionsPublishController from './service/sections/controller.admin.update.sections.publish';
import fetchAllServicesController from './service/sections/controller.admin.fetchallservices';
import fetchSingleServiceController from './service/sections/controller.admin.fetchsingleservice';
import deleteServicesController from './service/sections/controller.admin.deleteservices';
import createProductController from './products/controller.admin.create.product';
import registerUserController from '../account/controller.register.user';
import fetchUserGroupsController from './users/userEditor/controller.fetch.user.groups'

const router: Router = express.Router();

// Routes for Users
router.post('/api/admin/users/create-new-user', validateJWT, checkIsUserStatusActive, createUserController);
router.get('/api/admin/users/fetch-users', validateJWT, checkIsUserStatusActive, fetchUsers);
router.get('/users/list', validateJWT, checkIsUserStatusActive, fetchUsers);
router.post('/users/delete', validateJWT, checkIsUserStatusActive, deleteSelectedUsers);
router.get('/api/admin/users/fetch-user-by-userid/:userId', validateJWT, checkIsUserStatusActive, loadUserById);
router.post('/api/admin/users/update-user-by-userid/:userId', validateJWT, checkIsUserStatusActive, updateUserById);
router.post('/api/admin/users/delete-selected-users', validateJWT, checkIsUserStatusActive, deleteSelectedUsers);
router.get('/api/admin/users/:userId/groups', validateJWT, checkIsUserStatusActive, fetchUserGroupsController);

// Routes for Groups
router.post('/api/admin/groups/create-new-group', validateJWT, checkIsUserStatusActive, createGroupController);
router.get('/api/admin/groups/fetch-groups', validateJWT, checkIsUserStatusActive, fetchGroups);
router.post('/api/admin/groups/delete-selected-groups', validateJWT, checkIsUserStatusActive, deleteSelectedGroupsController);
router.get('/api/admin/groups/fetch-group-by-groupid/:groupId', validateJWT, checkIsUserStatusActive, fetchGroupById);
router.post('/api/admin/groups/update-group-by-groupid', validateJWT, checkIsUserStatusActive, updateGroupById);
router.get('/api/admin/groups/:groupId/members', validateJWT, checkIsUserStatusActive, fetchGroupMembers);
router.post('/api/admin/groups/:groupId/members/remove', validateJWT, checkIsUserStatusActive, removeGroupMembers);

// Routes for Catalog Admin
router.get('/api/admin/catalog/fetch-sections', validateJWT, checkIsUserStatusActive, fetchCatalogSections);
router.post('/api/admin/catalog/create-section', validateJWT, checkIsUserStatusActive, createCatalogSection);
router.post('/api/admin/catalog/update-section', validateJWT, checkIsUserStatusActive, updateCatalogSection);
router.post('/api/admin/catalog/delete-section', validateJWT, checkIsUserStatusActive, deleteCatalogSection);
router.get('/api/admin/catalog/fetchpublishingservices', validateJWT, checkIsUserStatusActive, fetchPublishingServicesController);
router.post('/api/admin/catalog/update-services-publish', validateJWT, checkIsUserStatusActive, updateSectionServicesPublishController);
// Ordering disabled: route removed

// Routes for Services Admin
router.post('/api/admin/services/create', validateJWT, checkIsUserStatusActive, createServiceController);
router.post('/api/admin/services/update', validateJWT, checkIsUserStatusActive, updateServiceController);
router.post('/api/admin/services/update-sections-publish', validateJWT, checkIsUserStatusActive, updateSectionsPublishController);
router.get('/api/admin/services/fetchallservices', validateJWT, checkIsUserStatusActive, fetchAllServicesController);
router.get('/api/admin/services/fetchpublishingsections', validateJWT, checkIsUserStatusActive, fetchPublishingSectionsController);
router.get('/api/admin/services/fetchsingleservice', validateJWT, checkIsUserStatusActive, fetchSingleServiceController);
router.post('/api/admin/services/deleteservices', validateJWT, checkIsUserStatusActive, deleteServicesController);

// Routes for Products Admin
router.post('/api/admin/products/create', validateJWT, checkIsUserStatusActive, createProductController);

// Routes for Account Management
router.post('/api/admin/users/register', registerUserController);

// Export using ES modules syntax
export default router;
/**
 * version: 1.0.09
 * Backend router file for admin functionality.
 * Defines routes for administrative functions focused on organization management.
 * All routes are protected by JWT validation and user status check middleware.
 * File: routes.admin.ts
 */

import express, { Router } from 'express';
import validateJWT from '../../core/guards/guard.validate.jwt';
import checkIsUserStatusActive from '../../core/guards/guard.check.is.user.status.active';
import checkRequestSecurityHard from '../../core/guards/guard.check.request.security.hard';

// Import controllers
import { fetchUsers, deleteSelectedUsers } from './org/usersList/routes.users.list';
import updateUserById from './org/userEditor/controller.update.user';
import loadUserById from './org/userEditor/controller.load.user';
import createUserController from './org/userEditor/controller.create.user';
import createGroupController from './org/groupEditor/controller.create.group';
import fetchGroups from './org/groupsList/controller.groups.list';
import deleteSelectedGroupsController from './org/groupsList/controller.delete.selected.groups';
import fetchGroupById from './org/groupEditor/controller.fetch.group';
import updateGroupById from './org/groupEditor/controller.update.group';
import fetchGroupMembers from './org/groupEditor/controller.fetch.group.members';
import removeGroupMembers from './org/groupEditor/controller.delete.group.members';
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
import fetchProductController from './products/controller.admin.fetch.product';
import updateProductController from './products/controller.admin.update.product';
import fetchAllProductsController from './products/controller.admin.fetch.all.products';
import fetchOptionsController from './products/controller.admin.fetch.options';
import deleteProductsController from './products/controller.admin.delete.products';
import fetchPublishingSectionsProductsController from './products/sections/controller.admin.fetch.publishingsections';
import updateProductSectionsPublishController from './products/sections/controller.admin.update.sections.publish';
import readProductOptionPairsController from './products/pairs/controller.admin.read.product.option.pairs';
import createProductOptionPairsController from './products/pairs/controller.admin.create.product.option.pairs';
import updateProductOptionPairsController from './products/pairs/controller.admin.update.product.option.pairs';
import deleteProductOptionPairsController from './products/pairs/controller.admin.delete.product.option.pairs';
import countProductOptionPairsController from './products/pairs/controller.admin.count.product.option.pairs';
import fetchCurrenciesController from './pricing/controller.admin.pricing.currencies';
import registerUserController from '../account/controller.register.user';
import fetchUserGroupsController from './org/userEditor/controller.fetch.user.groups';
import removeUserFromGroupsController from './org/userEditor/controller.remove.user.from.groups';

const router: Router = express.Router();

// Routes for Users
router.post('/api/admin/users/create-new-user', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, createUserController);
router.get('/api/admin/users/fetch-users', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchUsers);
router.get('/api/admin/users/fetch-user-by-userid/:userId', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, loadUserById);
router.post('/api/admin/users/update-user-by-userid/:userId', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateUserById);
router.post('/api/admin/users/delete-selected-users', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, deleteSelectedUsers);
router.get('/api/admin/users/:userId/groups', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchUserGroupsController);
router.post('/api/admin/users/remove-from-groups', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, removeUserFromGroupsController);

// Routes for Groups
router.post('/api/admin/groups/create-new-group', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, createGroupController);
router.get('/api/admin/groups/fetch-groups', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchGroups);
router.post('/api/admin/groups/delete-selected-groups', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, deleteSelectedGroupsController);
router.get('/api/admin/groups/fetch-group-by-groupid/:groupId', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchGroupById);
router.post('/api/admin/groups/update-group-by-groupid', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateGroupById);
router.get('/api/admin/groups/:groupId/members', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchGroupMembers);
router.post('/api/admin/groups/:groupId/members/remove', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, removeGroupMembers);

// Routes for Catalog Admin
router.get('/api/admin/catalog/fetch-sections', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchCatalogSections);
router.post('/api/admin/catalog/create-section', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, createCatalogSection);
router.post('/api/admin/catalog/update-section', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateCatalogSection);
router.post('/api/admin/catalog/delete-section', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, deleteCatalogSection);
router.get('/api/admin/catalog/fetchpublishingservices', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchPublishingServicesController);
router.post('/api/admin/catalog/update-services-publish', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateSectionServicesPublishController);
// Ordering disabled: route removed

// Routes for Services Admin
router.post('/api/admin/services/create', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, createServiceController);
router.post('/api/admin/services/update', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateServiceController);
router.post('/api/admin/services/update-sections-publish', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateSectionsPublishController);
router.get('/api/admin/services/fetchallservices', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchAllServicesController);
router.get('/api/admin/services/fetchpublishingsections', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchPublishingSectionsController);
router.get('/api/admin/services/fetchsingleservice', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchSingleServiceController);
router.post('/api/admin/services/deleteservices', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, deleteServicesController);

// Routes for Products Admin
router.get('/api/admin/products/fetch-all-products', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchAllProductsController);
router.get('/api/admin/products/fetch-options', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchOptionsController);
router.get('/api/admin/products/fetchpublishingsections', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchPublishingSectionsProductsController);
router.post('/api/admin/products/update-sections-publish', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateProductSectionsPublishController);
router.post('/api/admin/products/create', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, createProductController);
router.get('/api/admin/products/fetch', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchProductController);
router.post('/api/admin/products/update', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateProductController);
router.post('/api/admin/products/delete', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, deleteProductsController);

// Product option pairs endpoints
router.post('/api/admin/products/read-product-option-pairs', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, readProductOptionPairsController);
router.post('/api/admin/products/create-product-option-pairs', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, createProductOptionPairsController);
router.post('/api/admin/products/update-product-option-pairs', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateProductOptionPairsController);
router.post('/api/admin/products/delete-product-option-pairs', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, deleteProductOptionPairsController);
router.post('/api/admin/products/count-product-option-pairs', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, countProductOptionPairsController);

// Routes for Account Management
router.post('/api/admin/users/register', checkRequestSecurityHard, registerUserController);

// Routes for Pricing Admin
router.get('/api/admin/pricing/fetch-currencies', checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchCurrenciesController);

// Export using ES modules syntax
export default router;
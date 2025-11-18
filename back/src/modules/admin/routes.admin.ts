/**
 * version: 1.1.0
 * Backend router file for admin functionality.
 * Defines routes for administrative functions focused on organization management.
 * All routes are protected by rate limiting, JWT validation and user status check middleware.
 * File: routes.admin.ts
 * 
 * Changes in v1.1.0:
 * - Added rate limit guard as first guard in all routes for DDoS protection
 */

import express, { Router } from 'express';
import checkRateLimit from '../../core/guards/guard.rate.limit';
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
import fetchStatusesController from './products/controller.admin.fetch.statuses';
import fetchOptionsController from './products/controller.admin.fetch.options';
import deleteProductsController from './products/controller.admin.delete.products';
import fetchPublishingSectionsProductsController from './products/sections/controller.admin.fetch.publishingsections';
import updateProductSectionsPublishController from './products/sections/controller.admin.update.sections.publish';
import readProductOptionPairsController from './products/pairs/controller.admin.read.product.option.pairs';
import createProductOptionPairsController from './products/pairs/controller.admin.create.product.option.pairs';
import updateProductOptionPairsController from './products/pairs/controller.admin.update.product.option.pairs';
import deleteProductOptionPairsController from './products/pairs/controller.admin.delete.product.option.pairs';
import countProductOptionPairsController from './products/pairs/controller.admin.count.product.option.pairs';
import fetchCurrenciesController from './pricing/controller.admin.pricing.fetch.currencies';
import updateCurrenciesController from './pricing/controller.admin.pricing.update.currencies';
import fetchAllPriceListsController from './pricing/controller.admin.pricing.fetch.pricelists';
import fetchPriceListController from './pricing/controller.admin.pricing.fetch.pricelist';
import createPriceListController from './pricing/controller.admin.pricing.create.pricelist';
import updatePriceListController from './pricing/controller.admin.pricing.update.pricelist';
import deletePriceListsController from './pricing/controller.admin.pricing.delete.pricelists';
import createPriceListItemController from './pricing/controller.admin.create.pricelist.item';
import deletePriceListItemsController from './pricing/controller.admin.delete.pricelist.items';
import updatePriceListItemsController from './pricing/controller.admin.update.pricelist.items';
import fetchPriceItemTypesController from './pricing/controller.admin.fetch.price.item.types';
import registerUserController from '../account/controller.register.user';
import fetchUserGroupsController from './org/userEditor/controller.fetch.user.groups';
import removeUserFromGroupsController from './org/userEditor/controller.remove.user.from.groups';
import updateUserCountryController from '../account/controller.update.user.country';
import getUserCountryController from '../account/controller.get.user.country';

const router: Router = express.Router();

// Routes for Users
router.post('/api/admin/users/create-new-user', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, createUserController);
router.get('/api/admin/users/fetch-users', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchUsers);
router.get('/api/admin/users/fetch-user-by-userid/:userId', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, loadUserById);
router.post('/api/admin/users/update-user-by-userid/:userId', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateUserById);
router.post('/api/admin/users/delete-selected-users', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, deleteSelectedUsers);
router.get('/api/admin/users/:userId/groups', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchUserGroupsController);
router.post('/api/admin/users/remove-from-groups', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, removeUserFromGroupsController);

// Routes for Groups
router.post('/api/admin/groups/create-new-group', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, createGroupController);
router.get('/api/admin/groups/fetch-groups', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchGroups);
router.post('/api/admin/groups/delete-selected-groups', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, deleteSelectedGroupsController);
router.get('/api/admin/groups/fetch-group-by-groupid/:groupId', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchGroupById);
router.post('/api/admin/groups/update-group-by-groupid', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateGroupById);
router.get('/api/admin/groups/:groupId/members', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchGroupMembers);
router.post('/api/admin/groups/:groupId/members/remove', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, removeGroupMembers);

// Routes for Catalog Admin
router.get('/api/admin/catalog/fetch-sections', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchCatalogSections);
router.post('/api/admin/catalog/create-section', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, createCatalogSection);
router.post('/api/admin/catalog/update-section', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateCatalogSection);
router.post('/api/admin/catalog/delete-section', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, deleteCatalogSection);
router.get('/api/admin/catalog/fetchpublishingservices', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchPublishingServicesController);
router.post('/api/admin/catalog/update-services-publish', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateSectionServicesPublishController);
// Ordering disabled: route removed

// Routes for Services Admin
router.post('/api/admin/services/create', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, createServiceController);
router.post('/api/admin/services/update', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateServiceController);
router.post('/api/admin/services/update-sections-publish', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateSectionsPublishController);
router.get('/api/admin/services/fetchallservices', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchAllServicesController);
router.get('/api/admin/services/fetchpublishingsections', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchPublishingSectionsController);
router.get('/api/admin/services/fetchsingleservice', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchSingleServiceController);
router.post('/api/admin/services/deleteservices', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, deleteServicesController);

// Routes for Products Admin
router.get('/api/admin/products/fetch-all-products', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchAllProductsController);
router.get('/api/admin/products/fetch-statuses', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchStatusesController);
router.get('/api/admin/products/fetch-options', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchOptionsController);
router.get('/api/admin/products/fetchpublishingsections', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchPublishingSectionsProductsController);
router.post('/api/admin/products/update-sections-publish', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateProductSectionsPublishController);
router.post('/api/admin/products/create', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, createProductController);
router.get('/api/admin/products/fetch', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchProductController);
router.post('/api/admin/products/update', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateProductController);
router.post('/api/admin/products/delete', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, deleteProductsController);

// Product option pairs endpoints
router.post('/api/admin/products/read-product-option-pairs', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, readProductOptionPairsController);
router.post('/api/admin/products/create-product-option-pairs', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, createProductOptionPairsController);
router.post('/api/admin/products/update-product-option-pairs', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateProductOptionPairsController);
router.post('/api/admin/products/delete-product-option-pairs', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, deleteProductOptionPairsController);
router.post('/api/admin/products/count-product-option-pairs', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, countProductOptionPairsController);

// Routes for Account Management
router.post('/api/admin/users/register', checkRateLimit, checkRequestSecurityHard, registerUserController);
router.get('/api/admin/users/country', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, getUserCountryController);
router.post('/api/admin/users/update-country', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateUserCountryController);

// Routes for Pricing Admin - Currencies
router.get('/api/admin/pricing/fetch-currencies', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchCurrenciesController);
router.post('/api/admin/pricing/update-currencies', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updateCurrenciesController);

// Routes for Pricing Admin - Price Lists
router.get('/api/admin/pricing/pricelists/fetchall', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchAllPriceListsController);
router.get('/api/admin/pricing/pricelists/fetch', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchPriceListController);
router.post('/api/admin/pricing/pricelists/create', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, createPriceListController);
router.post('/api/admin/pricing/pricelists/update', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updatePriceListController);
router.post('/api/admin/pricing/pricelists/delete', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, deletePriceListsController);

// Routes for Pricing Admin - Price List Items
router.post('/api/admin/pricing/pricelists/:priceListId/createItem', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, createPriceListItemController);
router.post('/api/admin/pricing/pricelists/:priceListId/deleteItems', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, deletePriceListItemsController);
router.post('/api/admin/pricing/pricelists/:priceListId/updateItems', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, updatePriceListItemsController);

// Routes for Pricing Admin - Price Item Types
router.get('/api/admin/pricing/item-types', checkRateLimit, checkRequestSecurityHard, validateJWT, checkIsUserStatusActive, fetchPriceItemTypesController);

// Export using ES modules syntax
export default router;
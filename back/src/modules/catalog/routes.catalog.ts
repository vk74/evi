/**
 * version: 1.1.0
 * Backend router file for catalog module.
 * Catalog routes implementation with rate limiting, JWT validation and user status check middleware.
 * File: routes.catalog.ts
 * 
 * Changes in v1.1.0:
 * - Added rate limit guard as first guard in all routes for DDoS protection
 */

import express, { Router } from 'express';
import fetchSectionsController from './controller.catalog.sections';
import fetchServicesController from './controller.catalog.services';
import fetchServiceDetailsController from './controller.catalog.service.details';
import fetchProductsController from './controller.catalog.products';
import fetchProductDetailsController from './controller.catalog.product.details';
import readProductOptionsController from './controller.catalog.read.product.options';
import fetchPricelistItemsByCodesController from './controller.catalog.fetch.pricelist.items.by.codes';
import getPricelistByRegionController from './controller.catalog.get.pricelist.by.region';
import checkRateLimit from '../../core/guards/guard.rate.limit';
import validateJwt from '../../core/guards/guard.validate.jwt';
import checkIsUserStatusActive from '../../core/guards/guard.check.is.user.status.active';
import checkRequestSecurityHard from '../../core/guards/guard.check.request.security.hard';

const router: Router = express.Router();

// Catalog sections routes
router.get('/fetch-sections', checkRateLimit, checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, fetchSectionsController);

// Catalog services routes
router.get('/fetch-services', checkRateLimit, checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, fetchServicesController);
router.get('/fetch-service-details', checkRateLimit, checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, fetchServiceDetailsController);

// Catalog products routes
router.get('/fetch-products', checkRateLimit, checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, fetchProductsController);
router.get('/fetch-product-details', checkRateLimit, checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, fetchProductDetailsController);
router.post('/products/options', checkRateLimit, checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, readProductOptionsController);

// Catalog pricelist routes
router.post('/pricelists/:pricelistId/items-by-codes', checkRateLimit, checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, fetchPricelistItemsByCodesController);
router.get('/pricelist-by-region/:region', checkRateLimit, checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, getPricelistByRegionController);

// Export using ES modules syntax
export default router;
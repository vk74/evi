/**
 * version: 1.0.2
 * Backend router file for catalog module.
 * Catalog routes implementation with user status check middleware.
 * File: routes.catalog.ts
 */

import express, { Router } from 'express';
import fetchSectionsController from './controller.catalog.sections';
import fetchServicesController from './controller.catalog.services';
import fetchServiceDetailsController from './controller.catalog.service.details';
import fetchProductsController from './controller.catalog.products';
import fetchProductDetailsController from './controller.catalog.product.details';
import validateJwt from '../../core/guards/guard.validate.jwt';
import checkIsUserStatusActive from '../../core/guards/guard.check.is.user.status.active';
import checkRequestSecurityHard from '../../core/guards/guard.check.request.security.hard';

const router: Router = express.Router();

// Catalog sections routes
router.get('/fetch-sections', checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, fetchSectionsController);

// Catalog services routes
router.get('/fetch-services', checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, fetchServicesController);
router.get('/fetch-service-details', checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, fetchServiceDetailsController);

// Catalog products routes
router.get('/fetch-products', checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, fetchProductsController);
router.get('/fetch-product-details', checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, fetchProductDetailsController);

// Export using ES modules syntax
export default router;
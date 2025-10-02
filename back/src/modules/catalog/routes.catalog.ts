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
import validateJwt from '../../core/guards/guard.validate.jwt';
import checkIsUserStatusActive from '../../core/guards/guard.check.is.user.status.active';
import checkRequestSecurityHard from '../../core/guards/guard.check.request.security.hard';

const router: Router = express.Router();

// Catalog sections routes
router.get('/fetch-sections', checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, fetchSectionsController);
// Catalog services routes
router.get('/fetch-services', checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, fetchServicesController);
// Single service details
router.get('/fetch-service-details', checkRequestSecurityHard, validateJwt, checkIsUserStatusActive, fetchServiceDetailsController);

// Export using ES modules syntax
export default router;
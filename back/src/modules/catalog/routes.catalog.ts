/**
 * version: 1.0.0
 * Backend router file for catalog module.
 * Catalog routes implementation.
 * File: routes.catalog.ts
 */

import express, { Router } from 'express';
import fetchSectionsController from './controller.catalog.sections';
import fetchServicesController from './controller.catalog.services';
import fetchServiceDetailsController from './controller.catalog.service.details';
import validateJwt from '../../core/guards/auth.validate.jwt';

const router: Router = express.Router();

// Catalog sections routes
router.get('/fetch-sections', validateJwt, fetchSectionsController);
// Catalog services routes
router.get('/fetch-services', validateJwt, fetchServicesController);
// Single service details
router.get('/fetch-service-details', validateJwt, fetchServiceDetailsController);

// Export using ES modules syntax
export default router;
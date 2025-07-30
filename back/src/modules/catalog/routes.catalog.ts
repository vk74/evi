/**
 * version: 1.0.0
 * Backend router file for catalog module.
 * Catalog routes implementation.
 * File: routes.catalog.ts
 */

import express, { Router } from 'express';
import fetchSectionsController from './controller.catalog.sections';
import validateJwt from '../../core/guards/auth.validate.jwt';

const router: Router = express.Router();

// Catalog sections routes
router.get('/fetch-sections', validateJwt, fetchSectionsController);

// Export using ES modules syntax
export default router;
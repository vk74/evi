/**
 * version: 1.0.0
 * Public routes for backend services.
 * 
 * Functionality:
 * - Defines public API endpoints under /api/public/... for public services
 * - No authentication required for these endpoints
 * - Routes requests to appropriate controllers for public data access
 * File: routes.public.ts
 */

import express, { Router } from 'express';

// Import public controllers
import fetchPublicPasswordPoliciesController from '../public/controller.fetch.public.password.policies';
import getRegistrationStatusController from '../public/controller.public.registration.status';
import fetchPublicValidationRulesController from '../public/controller.fetch.public.validation.rules';

const router: Router = express.Router();

// Public routes (no authentication required)
router.get('/api/public/password-policies', fetchPublicPasswordPoliciesController);
router.get('/api/public/registration-status', getRegistrationStatusController);
router.get('/api/public/validation-rules', fetchPublicValidationRulesController);

// Export using ES modules syntax
export default router;

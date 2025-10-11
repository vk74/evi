/**
 * version: 1.0.1
 * Public routes for backend services.
 * 
 * Functionality:
 * - Defines public API endpoints under /api/public/... for public services
 * - No authentication required for these endpoints
 * - Routes requests to appropriate controllers for public data access
 * File: routes.public.ts
 */

import express, { Router } from 'express';
import checkRequestSecurityHard from '../guards/guard.check.request.security.hard';

// Import public controllers
import fetchPublicPasswordPoliciesController from '../public/controller.fetch.public.password.policies';
import getRegistrationStatusController from '../public/controller.public.registration.status';
import fetchPublicValidationRulesController from '../public/controller.fetch.public.validation.rules';
import fetchPublicUiSettingsController from '../public/controller.fetch.public.ui.settings';

const router: Router = express.Router();

// Public routes (no authentication required)
router.get('/api/public/password-policies', checkRequestSecurityHard, fetchPublicPasswordPoliciesController);
router.get('/api/public/registration-status', checkRequestSecurityHard, getRegistrationStatusController);
router.get('/api/public/validation-rules', checkRequestSecurityHard, fetchPublicValidationRulesController);
router.get('/api/public/ui-settings', checkRequestSecurityHard, fetchPublicUiSettingsController);

// Export using ES modules syntax
export default router;

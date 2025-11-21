/**
 * version: 1.2.0
 * Public routes for backend services.
 * 
 * Functionality:
 * - Defines public API endpoints under /api/public/... for public services
 * - No authentication required for these endpoints
 * - Includes rate limiting protection for DDoS prevention
 * - Routes requests to appropriate controllers for public data access
 * File: routes.public.ts
 * 
 * Changes in v1.1.0:
 * - Added rate limit guard as first guard in all routes for DDoS protection
 * 
 * Changes in v1.2.0:
 * - Renamed /api/public/ui-settings endpoint to /api/public/settings
 * - Aligned route naming with public settings terminology
 */

import express, { Router } from 'express';
import checkRateLimit from '../guards/guard.rate.limit';
import checkRequestSecurityHard from '../guards/guard.check.request.security.hard';

// Import public controllers
import fetchPublicPasswordPoliciesController from '../public/controller.fetch.public.password.policies';
import getRegistrationStatusController from '../public/controller.public.registration.status';
import fetchPublicValidationRulesController from '../public/controller.fetch.public.validation.rules';
import fetchPublicSettingsController from '../public/controller.fetch.public.settings';

const router: Router = express.Router();

// Public routes (no authentication required)
router.get('/api/public/password-policies', checkRateLimit, checkRequestSecurityHard, fetchPublicPasswordPoliciesController);
router.get('/api/public/registration-status', checkRateLimit, checkRequestSecurityHard, getRegistrationStatusController);
router.get('/api/public/validation-rules', checkRateLimit, checkRequestSecurityHard, fetchPublicValidationRulesController);
router.get('/api/public/settings', checkRateLimit, checkRequestSecurityHard, fetchPublicSettingsController);

// Export using ES modules syntax
export default router;

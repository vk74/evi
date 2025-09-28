/**
 * controller.fetch.public.validation.rules.ts - backend file
 * version: 1.0.0
 * Controller for handling public validation rules API requests.
 * Now uses universal connection handler with built-in rate limiting.
 */

import { Request, Response } from 'express';
import { fetchPublicValidationRules } from './service.fetch.public.validation.rules';
import { connectionHandler } from '../helpers/connection.handler';

/**
 * Business logic for fetching public validation rules
 * @param req Express request
 * @param res Express response
 */
async function fetchPublicValidationRulesLogic(req: Request, res: Response): Promise<any> {
  // Validate request method
  if (req.method !== 'GET') {
    throw new Error('Only GET method is allowed');
  }

  // Call service to fetch validation rules
  const result = await fetchPublicValidationRules(req);

  return result;
}

// Export controller using universal connection handler
export default connectionHandler(
  fetchPublicValidationRulesLogic, 
  'FetchPublicValidationRulesController'
);

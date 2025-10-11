/**
 * controller.fetch.public.ui.settings.ts - backend file
 * version: 1.0.0
 * Controller for handling public UI settings API requests.
 * Uses universal connection handler with built-in rate limiting.
 */

import { Request, Response } from 'express';
import { fetchPublicUiSettings } from './service.fetch.public.ui.settings';
import { connectionHandler } from '../helpers/connection.handler';

/**
 * Business logic for fetching public UI settings
 * @param req Express request
 * @param res Express response
 */
async function fetchPublicUiSettingsLogic(req: Request, res: Response): Promise<any> {
  // Validate request method
  if (req.method !== 'GET') {
    throw new Error('Only GET method is allowed');
  }

  // Call service to fetch public UI settings
  const result = await fetchPublicUiSettings(req);

  return result;
}

// Export controller using universal connection handler
export default connectionHandler(
  fetchPublicUiSettingsLogic, 
  'FetchPublicUiSettingsController'
);


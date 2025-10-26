/**
 * controller.fetch.public.settings.ts - backend file
 * version: 1.0.1
 * Controller for handling public settings API requests.
 * Uses universal connection handler with built-in rate limiting.
 */

import { Request, Response } from 'express';
import { fetchPublicUiSettings } from './service.fetch.public.settings';
import { connectionHandler } from '../helpers/connection.handler';

/**
 * Business logic for fetching public settings
 * Now delegates all business logic to the service layer
 * @param req Express request
 * @param res Express response
 */
async function fetchPublicSettingsLogic(req: Request, res: Response): Promise<any> {
  // Call service to fetch public settings
  const result = await fetchPublicUiSettings(req);

  return result;
}

// Export controller using universal connection handler
export default connectionHandler(
  fetchPublicSettingsLogic, 
  'FetchPublicSettingsController'
);

/**
 * controller.fetch.settings.ts - backend file
 * version: 1.0.03
 * Controller for handling settings fetch API requests.
 * Now uses universal connection handler for standardized HTTP processing.
 */

import { Request, Response } from 'express';
import { FetchSettingsResponse } from './types.settings';
import { handleFetchSettingsRequest } from './service.fetch.settings';
import { connectionHandler } from '../../../core/helpers/connection.handler';



// Extended Request interface to include user property added by auth middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username?: string;
    [key: string]: any;
  }
}



/**
 * Business logic for fetching settings
 * Now delegates all business logic to the service layer
 * @param req Express request
 * @param res Express response
 */
async function fetchSettingsLogic(req: AuthenticatedRequest, res: Response): Promise<FetchSettingsResponse> {
  return await handleFetchSettingsRequest(req);
}

// Export controller using universal connection handler
export default connectionHandler(fetchSettingsLogic, 'FetchSettingsController');

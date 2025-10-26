/**
 * controller.update.settings.ts - backend file
 * version: 1.0.03
 * Controller for handling setting update requests.
 * Validates incoming requests before passing to service.
 * Now uses universal connection handler for standardized HTTP processing.
 */

import { Request, Response } from 'express';
import { UpdateSettingResponse } from './types.settings';
import { handleUpdateSettingsRequest } from './service.update.settings';
import { connectionHandler } from '../../../core/helpers/connection.handler';

/**
 * Business logic for updating settings
 * Now delegates all business logic to the service layer
 * 
 * @param req - Express request object containing update parameters
 * @param res - Express response object
 */
async function updateSettingsLogic(req: Request, res: Response): Promise<UpdateSettingResponse> {
  return await handleUpdateSettingsRequest(req);
}

// Export controller using universal connection handler
export default connectionHandler(updateSettingsLogic, 'UpdateSettingsController');
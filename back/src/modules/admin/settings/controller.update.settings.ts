/**
 * controller.update.settings.ts - backend file
 * version: 1.0.03
 * Controller for handling setting update requests.
 * Validates incoming requests before passing to service.
 * Now uses universal connection handler for standardized HTTP processing.
 */

import { Request, Response } from 'express';
import { UpdateSettingRequest, UpdateSettingResponse } from './types.settings';
import { updateSetting } from './service.update.settings';
import { getRequestorUuidFromReq } from '../../../core/helpers/get.requestor.uuid.from.req';
import { connectionHandler } from '../../../core/helpers/connection.handler';

/**
 * Business logic for updating settings
 * 
 * @param req - Express request object containing update parameters
 * @param res - Express response object
 */
async function updateSettingsLogic(req: Request, res: Response): Promise<UpdateSettingResponse> {
  // Получаем UUID пользователя, делающего запрос
  const requestorUuid = getRequestorUuidFromReq(req);

  // Validate required fields in request
  const { sectionPath, settingName, value } = req.body;

  if (!sectionPath || !settingName || value === undefined) {
    throw new Error('Invalid request. sectionPath, settingName, and value are required.');
  }

  // Prepare request for service
  const updateRequest: UpdateSettingRequest = {
    sectionPath,
    settingName,
    value,
    environment: req.body.environment
  };

  // Call service to process update, передавая объект req
  const result = await updateSetting(updateRequest, req);

  return result;
}

// Export controller using universal connection handler
export default connectionHandler(updateSettingsLogic, 'UpdateSettingsController');
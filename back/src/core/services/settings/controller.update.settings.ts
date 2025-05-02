/**
 * controller.update.settings.ts - version 1.0.01
 * Controller for handling setting update requests.
 * Validates incoming requests before passing to service.
 * Now passes request object to service layer for user context access.
 */

import { Request, Response } from 'express';
import { UpdateSettingRequest, UpdateSettingResponse } from './types.settings';
import { updateSetting } from './service.update.settings';
import { createSystemLgr, Lgr } from '../../../core/lgr/lgr.index';
import { Events } from '../../../core/lgr/codes';
import { getRequestorUuidFromReq } from '../../../core/helpers/get.requestor.uuid.from.req';

// Create lgr for controller
const lgr: Lgr = createSystemLgr({
  module: 'SettingsController',
  fileName: 'controller.update.settings.ts'
});

/**
 * Handle request to update a setting
 * 
 * @param req - Express request object containing update parameters
 * @param res - Express response object
 */
export default async function handleUpdateSetting(req: Request, res: Response): Promise<void> {
  try {
    // Получаем UUID пользователя, делающего запрос
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Log incoming request
    lgr.debug({
      code: Events.CORE.SETTINGS.UPDATE.START.RECEIVED.code,
      message: 'Received setting update request',
      details: {
        body: req.body,
        requestorUuid
      }
    });

    // Validate required fields in request
    const { sectionPath, settingName, value } = req.body;

    if (!sectionPath || !settingName || value === undefined) {
      lgr.warn({
        code: Events.CORE.SETTINGS.UPDATE.PROCESS.VALIDATION_ERROR.code,
        message: 'Invalid update settings request',
        details: {
          sectionPath,
          settingName,
          hasValue: value !== undefined,
          requestorUuid
        }
      });
      
      res.status(400).json({
        success: false,
        error: 'Invalid request. sectionPath, settingName, and value are required.'
      });
      return;
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

    // Return result
    if (result.success) {
      lgr.info({
        code: Events.CORE.SETTINGS.UPDATE.PROCESS.SUCCESS.code,
        message: 'Setting update successful',
        details: {
          sectionPath,
          settingName,
          requestorUuid
        }
      });
      
      res.status(200).json(result);
    } else {
      // Failure, but not an exception
      lgr.warn({
        code: Events.CORE.SETTINGS.UPDATE.PROCESS.ERROR.code,
        message: 'Setting update failed',
        details: {
          sectionPath,
          settingName,
          error: result.error,
          requestorUuid
        }
      });
      
      res.status(400).json(result);
    }
  } catch (error) {
    // Handle exceptions
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const requestorUuid = getRequestorUuidFromReq(req);
    
    lgr.error({
      code: Events.CORE.SETTINGS.UPDATE.PROCESS.ERROR.code,
      message: 'Exception during setting update',
      error,
      details: {
        errorMessage,
        requestorUuid
      }
    });
    
    res.status(500).json({
      success: false,
      error: `Server error: ${errorMessage}`
    });
  }
}
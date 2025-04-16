/**
 * controller.update.settings.ts
 * Controller for handling setting update requests.
 * Validates incoming requests before passing to service.
 */

import { Request, Response } from 'express';
import { UpdateSettingRequest, UpdateSettingResponse } from './types.settings';
import { updateSetting } from './service.update.settings';
import { createSystemLogger, Logger } from '../../../core/logger/logger.index';
import { Events } from '../../../core/logger/codes';

// Create logger for controller
const logger: Logger = createSystemLogger({
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
    // Log incoming request
    logger.debug({
      code: Events.CORE.SETTINGS.UPDATE.START.RECEIVED.code,
      message: 'Received setting update request',
      details: {
        body: req.body,
        ip: req.ip
      }
    });

    // Validate required fields in request
    const { sectionPath, settingName, value } = req.body;

    if (!sectionPath || !settingName || value === undefined) {
      logger.warn({
        code: Events.CORE.SETTINGS.UPDATE.PROCESS.VALIDATION_ERROR.code,
        message: 'Invalid update settings request',
        details: {
          sectionPath,
          settingName,
          hasValue: value !== undefined
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

    // Call service to process update
    const result = await updateSetting(updateRequest);

    // Return result
    if (result.success) {
      logger.info({
        code: Events.CORE.SETTINGS.UPDATE.PROCESS.SUCCESS.code,
        message: 'Setting update successful',
        details: {
          sectionPath,
          settingName
        }
      });
      
      res.status(200).json(result);
    } else {
      // Failure, but not an exception
      logger.warn({
        code: Events.CORE.SETTINGS.UPDATE.PROCESS.ERROR.code,
        message: 'Setting update failed',
        details: {
          sectionPath,
          settingName,
          error: result.error
        }
      });
      
      res.status(400).json(result);
    }
  } catch (error) {
    // Handle exceptions
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error({
      code: Events.CORE.SETTINGS.UPDATE.PROCESS.ERROR.code,
      message: 'Exception during setting update',
      error,
      details: {
        errorMessage
      }
    });
    
    res.status(500).json({
      success: false,
      error: `Server error: ${errorMessage}`
    });
  }
}
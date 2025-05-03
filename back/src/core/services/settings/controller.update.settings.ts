/**
 * controller.update.settings.ts - backend file
 * version: 1.0.02
 * Controller for handling setting update requests.
 * Validates incoming requests before passing to service.
 * Now uses event system instead of logging.
 */

import { Request, Response } from 'express';
import { UpdateSettingRequest, UpdateSettingResponse } from './types.settings';
import { updateSetting } from './service.update.settings';
import { getRequestorUuidFromReq } from '../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../core/eventBus/fabric.events';
import { SETTINGS_UPDATE_CONTROLLER_EVENTS } from './events.settings';

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
    
    // Log incoming request using events
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_UPDATE_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
      req,
      payload: {
        method: req.method,
        url: req.url,
        body: req.body,
        requestorUuid
      }
    });

    // Validate required fields in request
    const { sectionPath, settingName, value } = req.body;

    if (!sectionPath || !settingName || value === undefined) {
      fabricEvents.createAndPublishEvent({
        eventName: SETTINGS_UPDATE_CONTROLLER_EVENTS.VALIDATION_ERROR.eventName,
        req,
        payload: {
          message: 'Invalid update settings request',
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
      fabricEvents.createAndPublishEvent({
        eventName: SETTINGS_UPDATE_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
        req,
        payload: {
          message: 'Setting update successful',
          sectionPath,
          settingName,
          statusCode: 200,
          requestorUuid
        }
      });
      
      res.status(200).json(result);
    } else {
      // Failure, but not an exception
      fabricEvents.createAndPublishEvent({
        eventName: SETTINGS_UPDATE_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
        req,
        payload: {
          message: 'Setting update failed',
          sectionPath,
          settingName,
          error: result.error,
          statusCode: 400,
          requestorUuid
        }
      });
      
      res.status(400).json(result);
    }
  } catch (error) {
    // Handle exceptions
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const requestorUuid = getRequestorUuidFromReq(req);
    
    fabricEvents.createAndPublishEvent({
      eventName: SETTINGS_UPDATE_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
      req,
      payload: {
        message: 'Exception during setting update',
        errorMessage,
        statusCode: 500,
        requestorUuid
      },
      errorData: errorMessage
    });
    
    res.status(500).json({
      success: false,
      error: `Server error: ${errorMessage}`
    });
  }
}
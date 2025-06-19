/**
 * controller.update.user.ts - version 1.0.04
 * Controller for handling user update requests from admin panel.
 * Processes requests, handles errors, and formats responses.
 * Now uses event bus for operation tracking.
 */

import { Request, Response } from 'express';
import { updateUserById as updateUserService } from './service.update.user';
import type { UpdateUserRequest, ServiceError } from './types.user.editor';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USER_UPDATE_CONTROLLER_EVENTS } from './events.user.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

async function updateUserLogic(req: Request, res: Response): Promise<any> {
  const updateData = req.body as UpdateUserRequest;
  
  // Log HTTP request received event
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: USER_UPDATE_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
    payload: {
      method: req.method,
      url: req.url,
      userId: updateData.user_id,
      updatedFields: Object.keys(updateData).filter(key => key !== 'user_id')
    }
  });

  // Passing the entire req object to the service
  const result = await updateUserService(updateData, req);
  
  // Log HTTP response sent event
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: USER_UPDATE_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
    payload: {
      userId: updateData.user_id,
      statusCode: 200,
      updatedFields: Object.keys(updateData).filter(key => key !== 'user_id')
    }
  });

  return result;
}

// Export controller using universal connection handler
export default connectionHandler(updateUserLogic);
/**
 * controller.update.user.ts - version 1.0.03
 * Controller for handling user update requests from admin panel.
 * Processes requests, handles errors, and formats responses.
 * Now uses event bus for operation tracking.
 */

import { Request, Response } from 'express';
import { updateUserById as updateUserService } from './service.update.user';
import type { UpdateUserRequest, ServiceError } from './types.user.editor';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USER_UPDATE_CONTROLLER_EVENTS } from './events.user.editor';

async function updateUserById(req: Request, res: Response): Promise<void> {
  const updateData = req.body as UpdateUserRequest;
  
  try {
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

    res.status(200).json(result);

  } catch (err: unknown) {
    const error = err as ServiceError;
    
    // Determine status code based on error
    const statusCode = error.code === 'NOT_FOUND' ? 404 : 500;
    
    // Log HTTP error event
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USER_UPDATE_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
      payload: {
        userId: updateData.user_id,
        errorCode: error.code || 'INTERNAL_SERVER_ERROR',
        statusCode: statusCode
      },
      errorData: error instanceof Error ? error.message : String(error)
    });

    const errorResponse = {
      success: false,
      message: error.message || 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : String(error)) : 
        undefined
    };

    res.status(statusCode).json(errorResponse);
  }
}

// Export using ES modules syntax
export default updateUserById;
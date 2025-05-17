/**
 * @file protoController.delete.users.ts
 * Version: 1.0.0
 * Controller for handling prototype user deletion API requests with server-side processing.
 * 
 * Functionality:
 * - Processes HTTP requests for user deletion
 * - Validates request parameters
 * - Delegates deletion logic to service layer (passing the entire req object)
 * - Formats API responses
 * - Generates events via event bus for tracing and monitoring
 */

import { Request, Response } from 'express';
import { protoUsersDeleteService } from './protoService.delete.users';
import { UserError } from './protoTypes.users.list';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USERS_DELETE_CONTROLLER_EVENTS } from './protoEvents.users.list';

/**
 * Controller function for deleting users
 */
async function deleteSelectedProtoUsers(req: Request, res: Response): Promise<void> {
  try {
    // Create event for incoming request
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USERS_DELETE_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
      payload: {
        method: req.method,
        url: req.url,
        userIds: req.body.userIds?.length
      }
    });

    // Validate request
    if (!req.body.userIds || !Array.isArray(req.body.userIds) || req.body.userIds.length === 0) {
      // Create event for invalid request
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USERS_DELETE_CONTROLLER_EVENTS.INVALID_REQUEST.eventName,
        payload: null
      });
      
      res.status(400).json({
        code: 'INVALID_REQUEST',
        message: 'No valid user IDs provided for deletion'
      });
      return;
    }

    // Execute delete through service, now passing the req object
    const deletedCount = await protoUsersDeleteService.deleteSelectedUsers(req.body.userIds, req);

    // Create event for successful response
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USERS_DELETE_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
      payload: {
        requestedCount: req.body.userIds.length,
        actuallyDeleted: deletedCount
      }
    });

    // Send response
    res.status(200).json({
      success: true,
      deletedCount
    });
    
  } catch (error) {
    // Create event for error
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USERS_DELETE_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
      payload: {
        userIds: req.body.userIds?.length,
        errorCode: (error as UserError)?.code || 'INTERNAL_SERVER_ERROR'
      },
      errorData: (error as Error)?.message || String(error)
    });

    // Format error response
    const userError: UserError = {
      code: (error as UserError)?.code || 'INTERNAL_SERVER_ERROR',
      message: (error as UserError)?.message || 'An error occurred while deleting users',
      details: process.env.NODE_ENV === 'development' ? 
        ((error as Error)?.message || String(error)) : 
        undefined
    };

    res.status(500).json(userError);
  }
}

export default deleteSelectedProtoUsers;

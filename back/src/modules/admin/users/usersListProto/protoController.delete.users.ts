/**
 * @file protoController.delete.users.ts
 * Version: 1.0.01
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
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for deleting users
 */
async function deleteSelectedProtoUsersLogic(req: Request, res: Response): Promise<any> {
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
    
    return Promise.reject({
      code: 'INVALID_REQUEST',
      message: 'No valid user IDs provided for deletion'
    });
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

  // Return response
  return {
    success: true,
    deletedCount
  };
}

// Export controller using universal connection handler
export default connectionHandler(deleteSelectedProtoUsersLogic);

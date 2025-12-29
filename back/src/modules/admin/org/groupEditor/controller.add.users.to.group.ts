/**
 * @file controller.add.users.to.group.ts
 * Version: 1.1.0
 * Controller for handling requests to add users to a group.
 * 
 * Functionality:
 * - Receives requests with group ID from URL and user IDs from body
 * - Validates input data
 * - Calls service to add users to group
 * - Returns response with operation status
 * - Handles and logs errors
 * - Publishes events to event bus for monitoring and tracking
 * Backend file
 * 
 * Changes in v1.1.0:
 * - Moved from core/services/item-selector to groupEditor module
 * - Updated to get groupId from URL parameter instead of request body
 * - Updated imports to use relative paths
 */
import { Request, Response } from 'express';
import { addUsersToGroup } from './service.add.users.to.group';
import type { 
  ServiceError
} from '../../../../core/services/item-selector/types.item.selector';
import { createAndPublishEvent } from '../../../../core/eventBus/fabric.events';
import { ADD_USERS_TO_GROUP_EVENTS } from '../../../../core/services/item-selector/events.item.selector';

interface AddUsersToGroupRequestBody {
  userIds: string[];
  addedBy?: string;
}

/**
 * Controller function that handles HTTP requests for adding users to group
 * @param req Express request object with user data from JWT
 * @param res Express response object
 */
async function addUsersToGroupController(req: Request & { user?: { uuid: string } }, res: Response) {
  const groupId = req.params.groupId;
  const requestData: AddUsersToGroupRequestBody = req.body;
  
  // Publish request received event
  await createAndPublishEvent({
    req,
    eventName: ADD_USERS_TO_GROUP_EVENTS.REQUEST_RECEIVED.eventName,
    payload: {
      groupId,
      userCount: requestData.userIds?.length || 0,
      requestedBy: req.user?.uuid
    }
  });

  // Basic validation
  if (!groupId || !requestData.userIds || !Array.isArray(requestData.userIds) || requestData.userIds.length === 0) {
    // Publish validation error event
    await createAndPublishEvent({
      req,
      eventName: ADD_USERS_TO_GROUP_EVENTS.VALIDATION_ERROR.eventName,
      payload: {
        groupId,
        userIds: requestData.userIds
      },
      errorData: 'Invalid request. Group ID and at least one user ID are required.'
    });
    
    res.status(400).json({
      success: false,
      message: 'Invalid request. Group ID and at least one user ID are required.',
      count: 0
    });
    return;
  }

  try {
    // Call service function to process the request
    const result = await addUsersToGroup(
      groupId,
      requestData.userIds,
      requestData.addedBy || req.user?.uuid || ''
    );

    // Publish success event
    await createAndPublishEvent({
      req,
      eventName: ADD_USERS_TO_GROUP_EVENTS.RESPONSE_SUCCESS.eventName,
      payload: {
        groupId,
        addedCount: result.count
      }
    });

    res.status(200).json(result);
  } catch (err) {
    const error = err as ServiceError;
    
    // Publish error event
    await createAndPublishEvent({
      req,
      eventName: ADD_USERS_TO_GROUP_EVENTS.RESPONSE_ERROR.eventName,
      payload: {
        groupId,
        error: error
      },
      errorData: error.message
    });

    // Handle specific error cases
    switch (error.code) {
      case 'VALIDATION_ERROR':
        // Publish validation error event
        await createAndPublishEvent({
          req,
          eventName: ADD_USERS_TO_GROUP_EVENTS.RESPONSE_VALIDATION_ERROR.eventName,
          payload: {
            groupId,
            error: error
          },
          errorData: error.message
        });
        res.status(400).json({
          success: false,
          message: error.message,
          count: 0
        });
        break;

      case 'NOT_FOUND_ERROR':
        // Publish not found error event
        await createAndPublishEvent({
          req,
          eventName: ADD_USERS_TO_GROUP_EVENTS.RESPONSE_NOT_FOUND_ERROR.eventName,
          payload: {
            groupId,
            error: error
          },
          errorData: error.message
        });
        res.status(400).json({
          success: false,
          message: error.message,
          count: 0
        });
        break;

      case 'PERMISSION_ERROR':
        // Publish permission error event
        await createAndPublishEvent({
          req,
          eventName: ADD_USERS_TO_GROUP_EVENTS.RESPONSE_PERMISSION_ERROR.eventName,
          payload: {
            groupId,
            error: error
          },
          errorData: error.message
        });
        res.status(403).json({
          success: false,
          message: error.message,
          count: 0
        });
        break;

      default:
        // Handle unexpected errors
        res.status(500).json({
          success: false,
          message: 'Internal server error occurred while adding users to group',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          count: 0
        });
    }
  }
}

export default addUsersToGroupController;


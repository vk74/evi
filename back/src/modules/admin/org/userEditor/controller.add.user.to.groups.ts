/**
 * @file controller.add.user.to.groups.ts
 * Version: 1.1.0
 * Controller for handling requests to add a user to multiple groups.
 * 
 * Functionality:
 * - Receives requests with user ID from URL and group IDs from body
 * - Validates input data
 * - Calls service to add user to groups
 * - Returns response with operation status
 * - Handles and logs errors
 * - Publishes events to event bus for monitoring and tracking
 * Backend file
 * 
 * Changes in v1.1.0:
 * - Moved from core/services/item-selector to userEditor module
 * - Updated to get userId from URL parameter instead of request body
 * - Updated imports to use relative paths
 */
import { Request, Response } from 'express';
import { addUserToGroups } from './service.add.user.to.groups';
import type { 
  ServiceError
} from '../../../../core/services/item-selector/types.item.selector';
import { createAndPublishEvent } from '../../../../core/eventBus/fabric.events';
import { ADD_USER_TO_GROUPS_EVENTS } from '../../../../core/services/item-selector/events.item.selector';

interface AddUserToGroupsRequestBody {
  groupIds: string[];
  addedBy?: string;
}

/**
 * Controller function that handles HTTP requests for adding a user to multiple groups
 * @param req Express request object with user data from JWT
 * @param res Express response object
 */
async function addUserToGroupsController(req: Request & { user?: { uuid: string } }, res: Response) {
  const userId = req.params.userId;
  const requestData: AddUserToGroupsRequestBody = req.body;
  
  // Publish request received event
  await createAndPublishEvent({
    req,
    eventName: ADD_USER_TO_GROUPS_EVENTS.REQUEST_RECEIVED.eventName,
    payload: {
      userId,
      groupCount: requestData.groupIds?.length || 0,
      requestedBy: req.user?.uuid
    }
  });

  // Basic validation
  if (!userId || !requestData.groupIds || !Array.isArray(requestData.groupIds) || requestData.groupIds.length === 0) {
    // Publish validation error event
    await createAndPublishEvent({
      req,
      eventName: ADD_USER_TO_GROUPS_EVENTS.VALIDATION_ERROR.eventName,
      payload: {
        userId,
        groupIds: requestData.groupIds
      },
      errorData: 'Invalid request. User ID and at least one group ID are required.'
    });
    
    res.status(400).json({
      success: false,
      message: 'Invalid request. User ID and at least one group ID are required.',
      count: 0
    });
    return;
  }

  try {
    // Call service function to process the request
    const result = await addUserToGroups(
      userId,
      requestData.groupIds,
      requestData.addedBy || req.user?.uuid || ''
    );

    // Publish success event
    await createAndPublishEvent({
      req,
      eventName: ADD_USER_TO_GROUPS_EVENTS.RESPONSE_SUCCESS.eventName,
      payload: {
        userId,
        addedCount: result.count
      }
    });

    res.status(200).json(result);
  } catch (err) {
    const error = err as ServiceError;
    
    // Publish error event
    await createAndPublishEvent({
      req,
      eventName: ADD_USER_TO_GROUPS_EVENTS.RESPONSE_ERROR.eventName,
      payload: {
        userId,
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
          eventName: ADD_USER_TO_GROUPS_EVENTS.RESPONSE_VALIDATION_ERROR.eventName,
          payload: {
            userId,
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
          eventName: ADD_USER_TO_GROUPS_EVENTS.RESPONSE_NOT_FOUND_ERROR.eventName,
          payload: {
            userId,
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
          eventName: ADD_USER_TO_GROUPS_EVENTS.RESPONSE_PERMISSION_ERROR.eventName,
          payload: {
            userId,
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
          message: 'Internal server error occurred while adding user to groups',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
          count: 0
        });
    }
  }
}

export default addUserToGroupsController;


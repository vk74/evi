/**
 * @file controller.change.group.owner.ts
 * Version: 1.1.0
 * Controller for handling requests to change the owner of a group.
 * 
 * Functionality:
 * - Receives requests with group ID from URL and new owner ID from body
 * - Validates input data
 * - Calls service to change group owner
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
import { changeGroupOwner } from './service.change.group.owner';
import type { 
  ServiceError
} from '../../../../core/services/item-selector/types.item.selector';
import { createAndPublishEvent } from '../../../../core/eventBus/fabric.events';
import { CHANGE_GROUP_OWNER_EVENTS } from '../../../../core/services/item-selector/events.item.selector';

interface ChangeGroupOwnerRequestBody {
  newOwnerId: string;
  changedBy?: string;
}

/**
 * Controller function that handles HTTP requests for changing group owner
 * @param req Express request object with user data from JWT
 * @param res Express response object
 */
async function changeGroupOwnerController(req: Request & { user?: { uuid: string } }, res: Response) {
  const groupId = req.params.groupId;
  const requestData: ChangeGroupOwnerRequestBody = req.body;
  
  // Publish request received event
  await createAndPublishEvent({
    req,
    eventName: CHANGE_GROUP_OWNER_EVENTS.REQUEST_RECEIVED.eventName,
    payload: {
      groupId,
      newOwnerId: requestData.newOwnerId,
      requestedBy: req.user?.uuid
    }
  });

  // Basic validation
  if (!groupId || !requestData.newOwnerId) {
    const missingField = !groupId ? 'groupId' : 'newOwnerId';
    
    // Publish validation error event
    await createAndPublishEvent({
      req,
      eventName: CHANGE_GROUP_OWNER_EVENTS.VALIDATION_ERROR.eventName,
      payload: {
        groupId,
        newOwnerId: requestData.newOwnerId,
        missingField
      },
      errorData: 'Invalid request. Group ID and new owner ID are required.'
    });
    
    res.status(400).json({
      success: false,
      message: 'Invalid request. Group ID and new owner ID are required.'
    });
    return;
  }

  try {
    // Call service function to process the request
    const result = await changeGroupOwner(
      groupId,
      requestData.newOwnerId,
      requestData.changedBy || req.user?.uuid || ''
    );

    // Publish success event
    await createAndPublishEvent({
      req,
      eventName: CHANGE_GROUP_OWNER_EVENTS.RESPONSE_SUCCESS.eventName,
      payload: {
        groupId,
        newOwnerId: requestData.newOwnerId,
        oldOwnerId: result.oldOwnerId
      }
    });

    res.status(200).json(result);
  } catch (err) {
    const error = err as ServiceError;
    
    // Publish error event
    await createAndPublishEvent({
      req,
      eventName: CHANGE_GROUP_OWNER_EVENTS.RESPONSE_ERROR.eventName,
      payload: {
        groupId,
        newOwnerId: requestData.newOwnerId,
        errorCode: error.code,
        errorMessage: error.message
      },
      errorData: error.message
    });

    // Handle specific error cases
    switch (error.code) {
      case 'VALIDATION_ERROR':
        // Publish validation error event
        await createAndPublishEvent({
          req,
          eventName: CHANGE_GROUP_OWNER_EVENTS.RESPONSE_VALIDATION_ERROR.eventName,
          payload: {
            groupId,
            newOwnerId: requestData.newOwnerId,
            error: error
          },
          errorData: error.message
        });
        res.status(400).json({
          success: false,
          message: error.message
        });
        break;

      case 'NOT_FOUND_ERROR':
        // Publish not found error event
        await createAndPublishEvent({
          req,
          eventName: CHANGE_GROUP_OWNER_EVENTS.RESPONSE_NOT_FOUND_ERROR.eventName,
          payload: {
            groupId,
            newOwnerId: requestData.newOwnerId,
            error: error
          },
          errorData: error.message
        });
        res.status(400).json({
          success: false,
          message: error.message
        });
        break;

      case 'PERMISSION_ERROR':
        // Publish permission error event
        await createAndPublishEvent({
          req,
          eventName: CHANGE_GROUP_OWNER_EVENTS.RESPONSE_PERMISSION_ERROR.eventName,
          payload: {
            groupId,
            newOwnerId: requestData.newOwnerId,
            error: error
          },
          errorData: error.message
        });
        res.status(403).json({
          success: false,
          message: error.message
        });
        break;

      default:
        // Handle unexpected errors - publish internal error event
        await createAndPublishEvent({
          req,
          eventName: CHANGE_GROUP_OWNER_EVENTS.RESPONSE_INTERNAL_ERROR.eventName,
          payload: {
            groupId,
            newOwnerId: requestData.newOwnerId,
            error: error
          },
          errorData: error.message
        });
        
        res.status(500).json({
          success: false,
          message: 'Internal server error occurred while changing group owner',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
  }
}

export default changeGroupOwnerController;

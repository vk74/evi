/**
 * @file controller.change.group.owner.ts
 * Controller for handling requests to change the owner of a group.
 * 
 * Functionality:
 * - Receives requests with group ID and new owner ID
 * - Validates input data
 * - Calls service to change group owner
 * - Returns response with operation status
 * - Handles and logs errors
 */
import { Request, Response } from 'express';
import { changeGroupOwner } from './service.change.group.owner';
import { 
  createAppLgr,
  Events 
} from '../../../core/lgr/lgr.index';
import type { 
  ChangeGroupOwnerRequest,
  ServiceError
} from './types.item.selector';

// Create lgr for the controller
const lgr = createAppLgr({
  module: 'ItemSelectorController',
  fileName: 'controller.change.group.owner.ts'
});

/**
 * Controller function that handles HTTP requests for changing group owner
 * @param req Express request object with user data from JWT
 * @param res Express response object
 */
async function changeGroupOwnerController(req: Request & { user?: { uuid: string } }, res: Response) {
  const requestData: ChangeGroupOwnerRequest = req.body;
  
  // Log request data for debugging
  lgr.info({
    code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.REQUEST.RECEIVED.code,
    message: 'Received request to change group owner',
    details: {
      groupId: requestData.groupId,
      newOwnerId: requestData.newOwnerId,
      requestedBy: req.user?.uuid
    }
  });

  // Basic validation
  if (!requestData.groupId || !requestData.newOwnerId) {
    const missingField = !requestData.groupId ? 'groupId' : 'newOwnerId';
    
    lgr.warn({
      code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.REQUEST.INVALID.code,
      message: 'Invalid request data for changing group owner',
      details: {
        groupId: requestData.groupId,
        newOwnerId: requestData.newOwnerId,
        missingField
      }
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
      requestData.groupId,
      requestData.newOwnerId,
      requestData.changedBy || req.user?.uuid || ''
    );

    // Log success and return result
    lgr.info({
      code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.RESPONSE.SUCCESS.code,
      message: 'Successfully changed group owner',
      details: {
        groupId: requestData.groupId,
        newOwnerId: requestData.newOwnerId,
        oldOwnerId: result.oldOwnerId
      }
    });

    res.status(200).json(result);
  } catch (err) {
    const error = err as ServiceError;
    
    // Log error with details
    lgr.error({
      code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.RESPONSE.ERROR.code,
      message: 'Failed to change group owner',
      details: {
        groupId: requestData.groupId,
        newOwnerId: requestData.newOwnerId,
        errorCode: error.code,
        errorMessage: error.message
      },
      error
    });

    // Handle specific error cases
    switch (error.code) {
      case 'VALIDATION_ERROR':
      case 'NOT_FOUND_ERROR':
        res.status(400).json({
          success: false,
          message: error.message
        });
        break;

      case 'PERMISSION_ERROR':
        res.status(403).json({
          success: false,
          message: error.message
        });
        break;

      default:
        // Handle unexpected errors
        lgr.error({
          code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.RESPONSE.INTERNAL_ERROR.code,
          message: 'Internal server error occurred while changing group owner',
          details: {
            groupId: requestData.groupId,
            newOwnerId: requestData.newOwnerId,
            error: error.details || error.message
          },
          error
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
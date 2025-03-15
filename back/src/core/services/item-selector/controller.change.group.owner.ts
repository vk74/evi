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
import type { 
  ChangeGroupOwnerRequest,
  ServiceError
} from './types.item.selector';

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => 
    console.log(`[${new Date().toISOString()}] [ChangeGroupOwner] ${message}`, meta || ''),
  error: (message: string, error: unknown, meta?: object) => 
    console.error(
      `[${new Date().toISOString()}] [ChangeGroupOwner] ${message}`,
      { error, ...meta }
    )
};

/**
 * Controller function that handles HTTP requests for changing group owner
 * @param req Express request object with user data from JWT
 * @param res Express response object
 */
async function changeGroupOwnerController(req: Request & { user?: { uuid: string } }, res: Response) {
  const requestData: ChangeGroupOwnerRequest = req.body;
  
  // Log request data for debugging
  logger.info('Received request to change group owner', {
    groupId: requestData.groupId,
    newOwnerId: requestData.newOwnerId,
    requestedBy: req.user?.uuid
  });

  // Basic validation
  if (!requestData.groupId || !requestData.newOwnerId) {
    logger.error('Invalid request data', null, {
      groupId: requestData.groupId,
      newOwnerId: requestData.newOwnerId
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
    logger.info('Successfully changed group owner', {
      groupId: requestData.groupId,
      newOwnerId: requestData.newOwnerId,
      oldOwnerId: result.oldOwnerId
    });

    res.status(200).json(result);
  } catch (err) {
    const error = err as ServiceError;
    
    // Log error with details
    logger.error('Failed to change group owner', error, {
      groupId: requestData.groupId,
      code: error.code
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
        res.status(500).json({
          success: false,
          message: 'Internal server error occurred while changing group owner',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
  }
}

export default changeGroupOwnerController;
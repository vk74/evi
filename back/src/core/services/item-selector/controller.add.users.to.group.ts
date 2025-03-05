/**
 * @file controller.add.users.to.group.ts
 * Controller for handling requests to add users to a group.
 * 
 * Functionality:
 * - Receives requests with user IDs and group ID
 * - Validates input data
 * - Calls service to add users to group
 * - Returns response with operation status
 * - Handles and logs errors
 */
import { Request, Response } from 'express';
import { addUsersToGroup } from './service.add.users.to.group';
import type { 
  AddUsersToGroupRequest,
  ServiceError
} from './types.item.selector';

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => 
    console.log(`[${new Date().toISOString()}] [AddUsersToGroup] ${message}`, meta || ''),
  error: (message: string, error: unknown, meta?: object) => 
    console.error(
      `[${new Date().toISOString()}] [AddUsersToGroup] ${message}`,
      { error, ...meta }
    )
};

/**
 * Controller function that handles HTTP requests for adding users to group
 * @param req Express request object with user data from JWT
 * @param res Express response object
 */
async function addUsersToGroupController(req: Request & { user?: { uuid: string } }, res: Response) {
  const requestData: AddUsersToGroupRequest = req.body;
  
  // Log request data for debugging
  logger.info('Received request to add users to group', {
    groupId: requestData.groupId,
    userCount: requestData.userIds?.length || 0,
    requestedBy: req.user?.uuid
  });

  // Basic validation
  if (!requestData.groupId || !requestData.userIds || !Array.isArray(requestData.userIds) || requestData.userIds.length === 0) {
    logger.error('Invalid request data', null, {
      groupId: requestData.groupId,
      userIds: requestData.userIds
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
      requestData.groupId,
      requestData.userIds,
      requestData.addedBy || req.user?.uuid || ''
    );

    // Log success and return result
    logger.info('Successfully added users to group', {
      groupId: requestData.groupId,
      addedCount: result.count
    });

    res.status(200).json(result);
  } catch (err) {
    const error = err as ServiceError;
    
    // Log error with details
    logger.error('Failed to add users to group', error, {
      groupId: requestData.groupId,
      code: error.code
    });

    // Handle specific error cases
    switch (error.code) {
      case 'VALIDATION_ERROR':
      case 'NOT_FOUND_ERROR':
        res.status(400).json({
          success: false,
          message: error.message,
          count: 0
        });
        break;

      case 'PERMISSION_ERROR':
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

module.exports = addUsersToGroupController;
/**
 * @file controller.remove.user.from.groups.ts
 * Version: 1.0.0
 * Backend controller for removing user from groups.
 * Backend file that handles HTTP requests to remove user from multiple groups.
 * 
 * Functionality:
 * - Handles HTTP POST requests to remove user from groups
 * - Extracts request parameters
 * - Delegates to service layer with request object
 * - Formats HTTP responses
 * - Uses event bus for tracking operations and enhancing observability
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { removeUserFromGroups as removeUserFromGroupsService } from './service.remove.user.from.groups';
import { 
  RemoveUserFromGroupsRequest
} from './types.user.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for removing user from groups
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function removeUserFromGroupsLogic(req: Request, res: Response): Promise<any> {
  const { userId, groupIds } = req.body;

  // Call service layer to remove user from groups, passing request object
  const request: RemoveUserFromGroupsRequest = { userId, groupIds };
  const result = await removeUserFromGroupsService(request, req);

  // Return result for connection handler to format
  return {
    success: true,
    message: result.message,
    removedCount: result.data?.removedCount || 0
  };
}

// Export controller using universal connection handler
export default connectionHandler(removeUserFromGroupsLogic, 'RemoveUserFromGroupsController');

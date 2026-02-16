/**
 * controller.delete.group.members.ts - version 1.0.03
 * Controller for handling group members deletion requests.
 * 
 * Functionality:
 * - Handles HTTP POST requests to remove group members
 * - Extracts request parameters
 * - Delegates to service layer with request object
 * - Formats HTTP responses
 * - Uses event bus for tracking operations and enhancing observability
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { removeGroupMembers as removeGroupMembersService } from './service.delete.group.members';
import { 
  RemoveGroupMembersRequest,
  ServiceErrorType 
} from './types.group.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for removing group members
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function removeGroupMembersLogic(req: Request, res: Response): Promise<any> {
  const groupId = req.params.groupId as string;
  const { userIds } = req.body;

  // Call service layer to remove group members, passing request object
  const request: RemoveGroupMembersRequest = { groupId, userIds };
  const result = await removeGroupMembersService(request, req);

  // Return result for connection handler to format
  return {
    success: true,
    message: result.message,
    removedCount: result.data?.removedCount || 0
  };
}

// Export controller using universal connection handler
export default connectionHandler(removeGroupMembersLogic, 'RemoveGroupMembersController');
/**
 * controller.fetch.group.members.ts - version 1.0.03
 * Controller for handling group members fetch requests.
 * 
 * Functionality:
 * - Handles HTTP GET requests to fetch group members
 * - Extracts request parameters
 * - Delegates to service layer with request object
 * - Formats HTTP responses
 * - Uses event bus for tracking operations and enhancing observability
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { fetchGroupMembers as fetchGroupMembersService } from './service.fetch.group.members';
import { 
  FetchGroupMembersRequest,
  ServiceErrorType 
} from './types.group.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for fetching group members
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchGroupMembersLogic(req: Request, res: Response): Promise<any> {
  const groupId = req.params.groupId as string;

  // Call service layer to fetch group members, passing request object
  const request: FetchGroupMembersRequest = { groupId };
  const result = await fetchGroupMembersService(request, req);

  // Return result for connection handler to format
  return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchGroupMembersLogic, 'FetchGroupMembersController');
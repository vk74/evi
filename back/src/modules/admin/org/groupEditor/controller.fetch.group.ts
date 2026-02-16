/**
 * controller.fetch.group.ts - version 1.0.03
 * Controller for fetching group data by group ID in the admin panel.
 * 
 * Functionality:
 * - Handles HTTP GET requests to retrieve group data
 * - Validates request parameters
 * - Delegates data loading to service layer (passing the request object)
 * - Handles response formatting and error cases
 * - Uses event bus for tracking operations and enhancing observability
 * 
 * Note: HTTP request/response events are now handled by the universal connection handler.
 */

import { Request, Response } from 'express';
import { fetchGroupData } from './service.fetch.group';
import { 
  FetchGroupRequest, 
  FetchGroupResponse, 
  ServiceError 
} from './types.group.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for fetching group data by group ID
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
async function fetchGroupLogic(req: Request, res: Response): Promise<any> {
  const groupId = req.params.groupId as string;

  if (!groupId) {
    throw new Error('Group ID is required');
  }

  // Call service layer to fetch group data, passing the request object
  const result: FetchGroupResponse = await fetchGroupData({ groupId }, req);

  // Return result for connection handler to format
  return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchGroupLogic, 'FetchGroupController');
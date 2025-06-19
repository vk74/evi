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
 */

import { Request, Response } from 'express';
import { removeGroupMembers as removeGroupMembersService } from './service.delete.group.members';
import { 
  RemoveGroupMembersRequest,
  ServiceErrorType 
} from './types.group.editor';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUP_MEMBERS_CONTROLLER_EVENTS } from './events.group.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for removing group members
 * Processes request, delegates to service layer, returns result
 */
async function removeGroupMembersLogic(req: Request, res: Response): Promise<any> {
  const groupId = req.params.groupId;
  const { userIds } = req.body;

  // Create event for incoming request
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_MEMBERS_CONTROLLER_EVENTS.REMOVE_HTTP_REQUEST_RECEIVED.eventName,
    payload: {
      groupId,
      userIdsCount: userIds?.length || 0,
      method: req.method,
      url: req.url
    }
  });

  // Call service layer to remove group members, passing request object
  const request: RemoveGroupMembersRequest = { groupId, userIds };
  const result = await removeGroupMembersService(request, req);

  // Create event for successful response
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_MEMBERS_CONTROLLER_EVENTS.REMOVE_HTTP_RESPONSE_SENT.eventName,
    payload: {
      groupId,
      removedCount: result.data?.removedCount || 0
    }
  });

  // Return response with format matching the frontend interface
  return {
    success: true,
    message: result.message,
    removedCount: result.data?.removedCount || 0
  };
}

// Export controller using universal connection handler
export default connectionHandler(removeGroupMembersLogic);
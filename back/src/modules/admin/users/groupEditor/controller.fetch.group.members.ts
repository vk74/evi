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
 */

import { Request, Response } from 'express';
import { fetchGroupMembers as fetchGroupMembersService } from './service.fetch.group.members';
import { 
  FetchGroupMembersRequest,
  ServiceErrorType 
} from './types.group.editor';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUP_MEMBERS_CONTROLLER_EVENTS } from './events.group.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for fetching group members
 * Processes request, delegates to service layer, returns result
 */
async function fetchGroupMembersLogic(req: Request, res: Response): Promise<any> {
  const groupId = req.params.groupId;

  // Создаем событие для входящего запроса
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_MEMBERS_CONTROLLER_EVENTS.FETCH_HTTP_REQUEST_RECEIVED.eventName,
    payload: {
      groupId,
      method: req.method,
      url: req.url
    }
  });

  // Call service layer to fetch group members, passing request object
  const request: FetchGroupMembersRequest = { groupId };
  const result = await fetchGroupMembersService(request, req);

  // Создаем событие для успешного ответа
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_MEMBERS_CONTROLLER_EVENTS.FETCH_HTTP_RESPONSE_SENT.eventName,
    payload: {
      groupId,
      memberCount: result.data?.total || 0
    }
  });

  // Return response
  return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchGroupMembersLogic);
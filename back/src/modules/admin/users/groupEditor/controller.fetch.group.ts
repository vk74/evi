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
 */

import { Request, Response } from 'express';
import { fetchGroupData } from './service.fetch.group';
import { 
  FetchGroupRequest, 
  FetchGroupResponse, 
  ServiceError 
} from './types.group.editor';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUP_FETCH_CONTROLLER_EVENTS } from './events.group.editor';
import { connectionHandler } from '../../../../core/helpers/connection.handler';

/**
 * Business logic for fetching group data by group ID
 * Processes request, delegates to service layer, returns result
 */
async function fetchGroupLogic(req: Request, res: Response): Promise<any> {
  const groupId = req.params.groupId;

  // Создаем событие для входящего запроса
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_FETCH_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
    payload: {
      groupId,
      method: req.method,
      url: req.url
    }
  });

  if (!groupId) {
    return Promise.reject({
      code: 'INVALID_REQUEST',
      message: 'Group ID is required'
    });
  }

  // Call service layer to fetch group data, passing the request object
  const result: FetchGroupResponse = await fetchGroupData({ groupId }, req);

  // Создаем событие для успешного ответа
  if (result.success && result.data) {
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_FETCH_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
      payload: {
        groupId,
        groupName: result.data.group.group_name,
        groupStatus: result.data.group.group_status
      }
    });
  }

  // Return response
  return result;
}

// Export controller using universal connection handler
export default connectionHandler(fetchGroupLogic);
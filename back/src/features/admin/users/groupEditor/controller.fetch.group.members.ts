/**
 * controller.fetch.group.members.ts - version 1.0.02
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

/**
 * Controller function for fetching group members
 * Processes request, delegates to service layer, handles response
 */
export async function fetchGroupMembers(req: Request, res: Response): Promise<void> {
  const groupId = req.params.groupId;

  try {
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

    // Send response
    res.status(200).json(result);

  } catch (err) {
    // Cast to service error type for handling
    const error = err as ServiceErrorType;
    
    // Создаем событие для ошибки
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_MEMBERS_CONTROLLER_EVENTS.FETCH_HTTP_ERROR.eventName,
      payload: {
        groupId,
        errorCode: error.code || 'UNKNOWN_ERROR'
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    // Determine response status and message based on error type
    let statusCode = 500;
    let message = 'An error occurred while processing your request';
    
    if (error.code === 'VALIDATION_ERROR') {
      statusCode = 400;
      message = error.message || `Invalid ${error.field}`;
    } else if (error.code === 'NOT_FOUND') {
      statusCode = 404;
      message = error.message || 'Resource not found';
    } else if (error.code === 'INTERNAL_SERVER_ERROR') {
      statusCode = 500;
      message = error.message || 'Internal server error';
    }
    
    // Send error response
    res.status(statusCode).json({
      success: false,
      message,
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
    });
  }
}

export default fetchGroupMembers;
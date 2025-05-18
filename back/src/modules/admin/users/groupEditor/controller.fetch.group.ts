/**
 * controller.fetch.group.ts - version 1.0.02
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

/**
 * Controller function for fetching group data by group ID
 * Processes request, delegates to service layer, handles response
 */
export async function fetchGroupById(req: Request, res: Response): Promise<void> {
  const groupId = req.params.groupId;

  try {
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
      res.status(400).json({
        success: false,
        message: 'Group ID is required'
      });
      return;
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

    // Send response
    res.status(result.success ? 200 : 404).json(result);

  } catch (err) {
    const error = err as ServiceError;
    
    // Создаем событие для ошибки
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_FETCH_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
      payload: {
        groupId,
        errorCode: error.code || 'UNKNOWN_ERROR'
      },
      errorData: error instanceof Error ? error.message : String(error)
    });

    // Determine response status and message based on error type
    const statusCode = error.code === 'INTERNAL_SERVER_ERROR' ? 500 : 404;
    const errorResponse = {
      success: false,
      message: error.message || 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : String(error)) : 
        undefined
    };

    res.status(statusCode).json(errorResponse);
  }
}

export default fetchGroupById;
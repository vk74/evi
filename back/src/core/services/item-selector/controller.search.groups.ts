/**
 * controller.search.groups.ts - backend file
 * version: 1.0.0
 * 
 * Controller for handling group search requests in the item selector
 * 
 * Functionality:
 * - Receives requests, passes them to service layer, and returns responses
 * - Uses universal connection handler for standardized HTTP processing
 * - Publishes events to event bus for monitoring and tracking
 */

import { Request, Response } from 'express';
import { searchGroups as searchGroupsService } from './service.search.groups';
import { 
  SearchParams, 
  SearchResult,
  SearchResponse,
  ServiceError 
} from './types.item.selector';
import { connectionHandler } from '../../helpers/connection.handler';
import { createAndPublishEvent } from '../../eventBus/fabric.events';
import { SEARCH_GROUPS_EVENTS } from './events.item.selector';

/**
 * Business logic for searching groups based on query and limit
 * Processes request, delegates to service layer, handles response
 */
async function searchGroupsLogic(req: Request, res: Response): Promise<SearchResponse> {
  const query = req.query.query as string;
  const limit = parseInt(req.query.limit as string, 10) || 20; // Default limit to 20 if not provided

  // Publish request received event
  await createAndPublishEvent({
    req,
    eventName: SEARCH_GROUPS_EVENTS.REQUEST_RECEIVED.eventName,
    payload: {
      searchTerm: query,
      limit,
      requestedBy: (req as any).user?.uuid
    }
  });

  try {
    // Call service layer to search groups
    const searchParams: SearchParams = { query, limit };
    const result: SearchResult[] = await searchGroupsService(searchParams);

    // Format response
    const response: SearchResponse = {
      success: true,
      items: result,
      total: result.length,
    };

    // Publish success event
    await createAndPublishEvent({
      req,
      eventName: SEARCH_GROUPS_EVENTS.RESPONSE_SUCCESS.eventName,
      payload: {
        searchTerm: query,
        resultCount: result.length
      }
    });

    return response;
  } catch (error) {
    // Publish error event
    await createAndPublishEvent({
      req,
      eventName: SEARCH_GROUPS_EVENTS.RESPONSE_ERROR.eventName,
      payload: {
        searchTerm: query,
        error: error as ServiceError
      },
      errorData: (error as Error).message
    });

    throw error;
  }
}

// Export controller using universal connection handler
export default connectionHandler(searchGroupsLogic, 'SearchGroupsController'); 
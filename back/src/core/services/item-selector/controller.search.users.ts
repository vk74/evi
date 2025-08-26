/**
 * controller.search.users.ts - backend file
 * version: 1.0.0
 * 
 * Controller for handling user search requests in the item selector.
 * 
 * Functionality:
 * - Handles HTTP GET requests to search for users
 * - Validates request parameters
 * - Delegates search logic to the service layer
 * - Uses universal connection handler for standardized HTTP processing
 * - Publishes events to event bus for monitoring and tracking
 * 
 * Note: Business logic and database operations are managed in the service layer (service.search.users.ts), not in this controller.
 */

import { Request, Response } from 'express';
import { searchUsers as searchUsersService } from './service.search.users';
import { 
  SearchParams, 
  SearchResult,
  SearchResponse,
  ServiceError 
} from './types.item.selector';
import { connectionHandler } from '../../helpers/connection.handler';
import { createAndPublishEvent } from '../../eventBus/fabric.events';
import { SEARCH_USERS_EVENTS } from './events.item.selector';

/**
 * Business logic for searching users based on query and limit
 * Processes request, delegates to service layer, handles response
 */
async function searchUsersLogic(req: Request, res: Response): Promise<SearchResponse> {
  const query = req.query.query as string;
  const limit = parseInt(req.query.limit as string, 10) || 20; // Default limit to 20 if not provided

  // Publish request received event
  await createAndPublishEvent({
    req,
    eventName: SEARCH_USERS_EVENTS.REQUEST_RECEIVED.eventName,
    payload: {
      searchTerm: query,
      limit,
      requestedBy: (req as any).user?.uuid
    }
  });

  if (!query || query.trim() === '') {
    throw new Error('Search query is required');
  }

  if (isNaN(limit) || limit < 1 || limit > 100) {
    throw new Error('Invalid limit value. Must be between 1 and 100');
  }

  try {
    // Call service layer to search users
    const searchParams: SearchParams = { query, limit };
    const result: SearchResult[] = await searchUsersService(searchParams);

    // Format response
    const response: SearchResponse = {
      success: true,
      items: result,
      total: result.length,
    };

    // Publish success event
    await createAndPublishEvent({
      req,
      eventName: SEARCH_USERS_EVENTS.RESPONSE_SUCCESS.eventName,
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
      eventName: SEARCH_USERS_EVENTS.RESPONSE_ERROR.eventName,
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
export default connectionHandler(searchUsersLogic, 'SearchUsersController');
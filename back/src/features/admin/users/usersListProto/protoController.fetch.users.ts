/**
 * @file protoController.fetch.users.ts
 * Version: 1.0.0
 * Controller for handling prototype user list fetch API requests with server-side processing.
 * 
 * Functionality:
 * - Processes HTTP requests for user data
 * - Validates request parameters
 * - Delegates business logic to service layer (passing the entire req object)
 * - Formats API responses
 * - Generates events via event bus for tracing and monitoring
 */

import { Request, Response } from 'express';
import { protoUsersFetchService } from './protoService.fetch.users';
import { IUsersFetchParams, UserError } from './protoTypes.users.list';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USERS_FETCH_CONTROLLER_EVENTS } from './protoEvents.users.list';

/**
 * Controller function for fetching users
 */
async function fetchProtoUsers(req: Request, res: Response): Promise<void> {
  try {
    // Create event for incoming request
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USERS_FETCH_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
      payload: {
        method: req.method,
        url: req.url,
        query: req.query
      }
    });

    // Parse and validate query parameters
    const params: IUsersFetchParams = {
      page: parseInt(req.query.page as string) || 1,
      itemsPerPage: parseInt(req.query.itemsPerPage as string) || 25,
      search: (req.query.search as string || '').trim(),
      sortBy: req.query.sortBy as string,
      sortDesc: req.query.sortDesc === 'true',
      forceRefresh: req.query.forceRefresh === 'true'
    };
    
    // Validate search query length
    if (params.search && params.search.length === 1) {
      // Create event for invalid search
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USERS_FETCH_CONTROLLER_EVENTS.INVALID_SEARCH.eventName,
        payload: { search: params.search }
      });
      
      res.status(400).json({
        code: 'INVALID_SEARCH',
        message: 'Search query must be at least 2 characters or empty'
      });
      return;
    }

    // Handle the request through service, now passing the req object
    const result = await protoUsersFetchService.fetchUsers(params, req);

    // Create event for successful response
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USERS_FETCH_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
      payload: {
        resultCount: result.users.length,
        totalCount: result.total
      }
    });

    // Send response
    res.status(200).json(result);
    
  } catch (error) {
    // Create event for error
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USERS_FETCH_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
      payload: {
        query: req.query,
        errorCode: (error as UserError)?.code || 'INTERNAL_SERVER_ERROR'
      },
      errorData: (error as Error)?.message || String(error)
    });

    // Format error response
    const userError: UserError = {
      code: (error as UserError)?.code || 'INTERNAL_SERVER_ERROR',
      message: (error as UserError)?.message || 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? 
        ((error as Error)?.message || String(error)) : 
        undefined
    };

    res.status(500).json(userError);
  }
}

export default fetchProtoUsers;

/**
 * @file controller.fetch.users.ts - version 1.0.01
 * Controller for handling user list fetch API requests.
 * 
 * Functionality:
 * - Processes HTTP requests for user data
 * - Validates request parameters
 * - Delegates business logic to service layer (passing the entire req object)
 * - Formats API responses
 */

import { Request, Response } from 'express';
import { usersFetchService } from './service.fetch.users';
import { IUsersFetchParams, UserError } from './types.users.list';

// Helper for request logging
function logRequest(message: string, meta: object): void {
  console.log(`[${new Date().toISOString()}] [UsersFetchController] ${message}`, meta);
}

// Helper for error logging
function logError(message: string, error: unknown, meta: object): void {
  console.error(`[${new Date().toISOString()}] [UsersFetchController] ${message}`, { error, ...meta });
}

/**
 * Controller function for fetching users
 */
async function fetchUsers(req: Request, res: Response): Promise<void> {
  try {
    // Log incoming request
    logRequest('Received fetch users request', {
      method: req.method,
      url: req.url,
      query: req.query
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
      logRequest('Invalid search query (too short)', { search: params.search });
      res.status(400).json({
        code: 'INVALID_SEARCH',
        message: 'Search query must be at least 2 characters or empty'
      });
      return;
    }

    // Handle the request through service, now passing the req object
    const result = await usersFetchService.fetchUsers(params, req);

    // Log successful response
    logRequest('Successfully processed users fetch request', {
      resultCount: result.users.length,
      totalCount: result.total
    });

    // Send response
    res.status(200).json(result);
    
  } catch (error) {
    // Log error
    logError('Error while fetching users', error, {
      query: req.query
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

export default fetchUsers;
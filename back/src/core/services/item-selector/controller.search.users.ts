/**
 * controller.search.users.ts
 * Controller for handling user search requests in the item selector.
 * 
 * Functionality:
 * - Handles HTTP GET requests to search for users
 * - Validates request parameters
 * - Delegates search logic to the service layer
 * - Handles response formatting and error cases
 * - Provides request and response logging
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

// Logging helper functions
function logRequest(message: string, meta: object): void {
  console.log(`[${new Date().toISOString()}] [SearchUsers] ${message}`, meta);
}

function logError(message: string, error: unknown, meta: object): void {
  console.error(`[${new Date().toISOString()}] [SearchUsers] ${message}`, { error, ...meta });
}

/**
 * Controller function for searching users based on query and limit
 * Processes request, delegates to service layer, handles response
 */
export async function searchUsers(req: Request, res: Response): Promise<void> {
  const query = req.query.query as string;
  const limit = parseInt(req.query.limit as string, 10) || 20; // Default limit to 20 if not provided

  try {
    // Log incoming request
    logRequest('Received request to search users', {
      method: req.method,
      url: req.url,
      query,
      limit,
    });

    if (!query || query.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
      return;
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        message: 'Invalid limit value. Must be between 1 and 100',
      });
      return;
    }

    // Call service layer to search users
    const searchParams: SearchParams = { query, limit };
    const result: SearchResult[] = await searchUsersService(searchParams);

    // Format response
    const response: SearchResponse = {
      success: true,
      items: result,
      total: result.length,
    };

    // Log successful response
    logRequest('Successfully searched users', {
      query,
      limit,
      totalResults: result.length,
    });

    // Send response
    res.status(200).json(response);

  } catch (err) {
    const error = err as ServiceError;
    
    // Log error
    logError('Error while searching users', error, { query, limit });

    // Determine response status and message based on error type
    const statusCode = error.code === 'INTERNAL_SERVER_ERROR' ? 500 : 400;
    const errorResponse = {
      success: false,
      message: error.message || 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : String(error)) : 
        undefined,
    };

    res.status(statusCode).json(errorResponse);
  }
}

export default searchUsers;